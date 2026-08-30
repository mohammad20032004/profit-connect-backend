const mongoose = require('mongoose');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Job = require('../models/Job');

// أوزان كل معامل (النقاط القصوى الممكنة لكل معامل)
const WEIGHTS = {
  industryMax: 100,    // نفس المجال المهني
  locationMax: 50,     // نفس المنطقة/المدينة
  mutualMax: 100,      // جهات اتصال مشتركة
  skillMax: 60,        // مهارات مشتركة
  rScoreMax: 60,       // سمعة المستخدم (R-Score)
  followersMax: 30,    // الشعبية
  recencyMax: 20,      // حداثة الحساب (حسابات جديدة تظهر للأعلى لمدة معينة)
};

// حدود القيم لحماية النتيجة من التأثر بحسابات ضخمة وحشو الصفحات بصناعة واحدة
const CAPS = {
  mutualCount: 5,      // سقف عدد الاتصالات المشتركة المؤثرة
  skillCount: 5,       // سقف عدد المهارات المشتركة المؤثرة
  rScore: 1000,        // أكثر من 1000 نقطة سمعة يعتبر "خبير" ولا يُضاعف
  followersSqrt: 8,    // سقف الجذر التربيعي للمتابعين (64 متابع = أقصى معامل)
  recencyDays: 30,     // فترة الاستفادة من حداثة الحساب بالأيام
  perIndustry: 3,      // الحد الأقصى من نفس الصناعة في النتيجة (تنوّع)
};

// الحقول المستخرجة مع النتيجة للحفاظ على نفس شكل الاستجابة السابق
const PROJECT_FIELDS = {
  username: 1,
  role: 1,
  profile: {
    firstName: 1,
    lastName: 1,
    fullname: 1,
    avatar: 1,
    headline: 1,
    bio: 1,
    location: 1,
    followersCount: 1,
    rScore: 1,
  },
  professional: 1,
  createdAt: 1,
  score: 1,
  mutualCount: 1,
  industryMatch: 1,
  locationMatch: 1,
  skillsOverlap: 1,
  _industry: { $ifNull: ['$professional.industry', ''] },
};

const VALID_ROLES = ['Employer', 'JobSeeker', 'FreelanceClient'];

/**
 * اقتراح أشخاص منظمين حسب الملاءمة بدلاً من العشوائية.
 * @param {String} userId - معرف المستخدم الحالي
 * @param {Object} options - { limit, excludeFollowing, role, diversity }
 */
async function getPersonRecommendations(userId, options = {}) {
  const {
    limit = 10,
    excludeFollowing = true,
    role = null,
    diversity = true,
  } = options;

  const me = await User.findById(userId).select(
    'status profile.location profile.following profile.followers professional.industry professional.skills'
  );
  if (!me || me.status !== 'active') return [];

  // شبكة المستخدم = من يتابعهم + متابعوه + جهات اتصاله المقبولة
  const mySkills = (me.professional?.skills || [])
    .map((s) => String(s).toLowerCase())
    .filter(Boolean);

  const myFollowing = (me.profile?.following || []).map((id) => id.toString());
  const myFollowers = (me.profile?.followers || []).map((id) => id.toString());
  const myConnections = await Connection.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  }).select('requester recipient');

  const myNetworkSet = new Set(myFollowing);
  myFollowers.forEach((id) => myNetworkSet.add(id));
  myConnections.forEach((c) => {
    const other = c.requester.toString() === userId ? c.recipient : c.requester;
    myNetworkSet.add(other.toString());
  });
  const myNetwork = [...myNetworkSet].map((id) => new mongoose.Types.ObjectId(id));

  const match = { _id: { $ne: new mongoose.Types.ObjectId(userId) }, status: 'active' };
  if (excludeFollowing && myNetwork.length) {
    match._id.$nin = myNetwork;
  }
  if (role && VALID_ROLES.includes(role)) {
    match.role = role;
  }

  const industryLiteral = me.professional?.industry
    ? String(me.professional.industry).toLowerCase()
    : null;
  const locationLiteral = me.profile?.location
    ? String(me.profile.location).toLowerCase()
    : null;

  const poolSize = Math.min(limit * 6, 200);

  const pipeline = [
    { $match: match },
    // حساب جهات الاتصال المشتركة بين المرشح وشبكة المستخدم
    {
      $lookup: {
        from: 'connections',
        let: { candId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$status', 'accepted'] },
                  {
                    $or: [
                      { $eq: ['$requester', '$$candId'] },
                      { $eq: ['$recipient', '$$candId'] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              other: {
                $cond: [{ $eq: ['$requester', '$$candId'] }, '$recipient', '$requester'],
              },
            },
          },
        ],
        as: 'candidateConnections',
      },
    },
    {
      $addFields: {
        mutualCount: {
          $size: { $setIntersection: ['$candidateConnections.other', myNetwork] },
        },
      },
    },
    {
      $addFields: {
        industryMatch: {
          $cond: [
            { $eq: [{ $toLower: { $ifNull: ['$professional.industry', ''] } }, industryLiteral] },
            1,
            0,
          ],
        },
        locationMatch: {
          $cond: [
            { $eq: [{ $toLower: { $ifNull: ['$profile.location', ''] } }, locationLiteral] },
            1,
            0,
          ],
        },
        skillsOverlap: {
          $size: {
            $setIntersection: [
              {
                $map: {
                  input: { $ifNull: ['$professional.skills', []] },
                  as: 'sk',
                  in: { $toLower: '$$sk' },
                },
              },
              mySkills,
            ],
          },
        },
        rScoreValue: { $ifNull: ['$profile.rScore', 0] },
        followersCount: { $ifNull: ['$profile.followersCount', 0] },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ['$industryMatch', WEIGHTS.industryMax] },
            { $multiply: ['$locationMatch', WEIGHTS.locationMax] },
            {
              $multiply: [
                { $min: ['$mutualCount', CAPS.mutualCount] },
                WEIGHTS.mutualMax / CAPS.mutualCount,
              ],
            },
            {
              $multiply: [
                { $min: ['$skillsOverlap', CAPS.skillCount] },
                WEIGHTS.skillMax / CAPS.skillCount,
              ],
            },
            {
              $multiply: [
                { $min: ['$rScoreValue', CAPS.rScore] },
                WEIGHTS.rScoreMax / CAPS.rScore,
              ],
            },
            {
              $multiply: [
                { $min: [{ $sqrt: '$followersCount' }, CAPS.followersSqrt] },
                WEIGHTS.followersMax / CAPS.followersSqrt,
              ],
            },
            // مكافأة حداثة الحساب: الأحدث يأخذ نقاطاً تتناقص حتى الصفر بعد 30 يوماً
            {
              $max: [
                0,
                {
                  $subtract: [
                    WEIGHTS.recencyMax,
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: [new Date(), { $ifNull: ['$createdAt', new Date(0)] }] },
                            86400000,
                          ],
                        },
                        WEIGHTS.recencyMax / CAPS.recencyDays,
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    { $project: PROJECT_FIELDS },
    { $sort: { score: -1, 'profile.rScore': -1, createdAt: -1 } },
    { $limit: poolSize },
  ];

  let candidates = await User.aggregate(pipeline);

  candidates = diversity
    ? applyDiversity(candidates, limit, CAPS.perIndustry)
    : candidates.slice(0, limit);

  return candidates.map((u) => ({
    _id: u._id,
    username: u.username,
    role: u.role,
    profile: u.profile,
    professional: u.professional,
    isFollowing: false,
    score: Math.round(u.score * 100) / 100,
    matchReasons: buildMatchReasons(u),
  }));
}

// تنويع النتيجة: لا نسمح باحتكار الصناعات حتى لا تتكرر الوجوه نفسها
function applyDiversity(candidates, limit, perIndustry) {
  const counts = {};
  const selected = [];

  for (const c of candidates) {
    if (selected.length >= limit) break;
    const key = String(c._industry || 'unknown');
    if ((counts[key] || 0) >= perIndustry) continue;
    counts[key] = (counts[key] || 0) + 1;
    selected.push(c);
  }

  // لو لم يكتمل العدد بسبب حد التنويع، نكمل بباقي المرشحين الأفضل
  for (const c of candidates) {
    if (selected.length >= limit) break;
    if (selected.includes(c)) continue;
    selected.push(c);
  }

  return selected;
}

// أسباب التوصية لعرضها في الواجهة الأمامية
function buildMatchReasons(u) {
  const reasons = [];
  if (u.industryMatch) reasons.push('نفس المجال المهني');
  if (u.locationMatch) reasons.push('نفس المنطقة/المدينة');
  if (u.mutualCount) reasons.push(`${u.mutualCount} جهات اتصال مشتركة`);
  if (u.skillsOverlap) reasons.push(`${u.skillsOverlap} مهارات مشتركة`);
  return reasons;
}

// ============================================================
// نظام توصية الوظائف
// ============================================================

const JOB_WEIGHTS = {
  skillMax: 150,     // 30 نقطة لكل مهارة مشتركة (حتى 5)
  industryMax: 100,  // شركة في نفس مجال المستخدم
  locationMax: 80,   // موقع الوظيفة قريب من مدينة المستخدم
  levelMax: 40,      // نفس المستوى الوظيفي (Entry/Mid/Senior/...)
  levelAdjacent: 20, // المستوى المجاور
  verifiedMax: 20,   // شركة موثقة
  trustMax: 10,      // شعبية الشركة (متابعون)
  recencyMax: 20,    // حداثة النشر
};

const JOB_CAPS = {
  skillCount: 5,
  recencyDays: 30,
};

const LEVEL_ORDER = { Entry: 0, Mid: 1, Senior: 2, Director: 3, VP: 4 };

// تحويل سنوات الخبرة إلى المستوى الوظيفي المتوقع
function levelFromYears(years) {
  if (years <= 1) return LEVEL_ORDER.Entry;
  if (years <= 4) return LEVEL_ORDER.Mid;
  if (years <= 8) return LEVEL_ORDER.Senior;
  if (years <= 12) return LEVEL_ORDER.Director;
  return LEVEL_ORDER.VP;
}

/**
 * توصية وظائف مرتبة حسب ملاءمتها لملف المستخدم (مهارات، مجال، مدينة، خبرة).
 * يبقى شكل الاستجابة كأنها قائمة وظائف عادية (`data: [jobs]`).
 * @param {Object} user - مستند المستخدم (يحتاج professional + profile.location)
 * @param {Object} options - { filters, limit }
 */
async function getJobRecommendations(user, { filters = {}, limit = 10, poolSize = 60 } = {}) {
  const userSkills = (user.professional?.skills || [])
    .map((s) => String(s).toLowerCase())
    .filter(Boolean);
  const userIndustry = user.professional?.industry
    ? String(user.professional.industry).toLowerCase()
    : null;
  const userCity = user.profile?.location
    ? String(user.profile.location).toLowerCase().trim()
    : null;
  const years = Number(user.professional?.yearsOfExperience);
  const hasExperience = Number.isFinite(years) && years >= 0;
  const userLevel = hasExperience ? levelFromYears(years) : null;

  const match = { ...filters, status: 'Open' };

  const levelSwitch = {
    $switch: {
      branches: [
        { case: { $eq: ['$levelDiff', 0] }, then: JOB_WEIGHTS.levelMax },
        { case: { $eq: ['$levelDiff', 1] }, then: JOB_WEIGHTS.levelAdjacent },
      ],
      default: 0,
    },
  };

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'companies', localField: 'company', foreignField: '_id', as: 'companyDoc' } },
    { $addFields: { companyObj: { $arrayElemAt: ['$companyDoc', 0] } } },
    {
      $addFields: {
        skillsOverlap: {
          $size: {
            $setIntersection: [
              { $map: { input: { $ifNull: ['$skills', []] }, as: 'sk', in: { $toLower: '$$sk' } } },
              userSkills,
            ],
          },
        },
        industryMatch: userIndustry
          ? {
              $cond: [
                {
                  $eq: [
                    { $toLower: { $ifNull: ['$companyObj.industry', ''] } },
                    userIndustry,
                  ],
                },
                1,
                0,
              ],
            }
          : 0,
        locationMatch: userCity
          ? {
              $cond: [
                {
                  $ne: [
                    {
                      $indexOfCP: [
                        { $toLower: { $ifNull: ['$location', ''] } },
                        userCity,
                      ],
                    },
                    -1,
                  ],
                },
                1,
                0,
              ],
            }
          : 0,
        jobLevelVal: {
          $switch: {
            branches: Object.entries(LEVEL_ORDER).map(([name, val]) => ({
              case: { $eq: ['$workLevel', name] },
              then: val,
            })),
            default: 0,
          },
        },
      },
    },
    {
      $addFields: {
        levelDiff:
          userLevel === null
            ? null
            : { $abs: { $subtract: ['$jobLevelVal', userLevel] } },
      },
    },
    {
      $addFields: {
        levelFit: userLevel === null ? 0 : levelSwitch,
        verifiedBonus: {
          $cond: [{ $eq: ['$companyObj.isVerified', true] }, JOB_WEIGHTS.verifiedMax, 0],
        },
        trustBonus: {
          $multiply: [
            { $min: [{ $sqrt: { $ifNull: ['$companyObj.followersCount', 0] } }, 5] },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $min: ['$skillsOverlap', JOB_CAPS.skillCount] }, JOB_WEIGHTS.skillMax / JOB_CAPS.skillCount] },
            { $multiply: ['$industryMatch', JOB_WEIGHTS.industryMax] },
            { $multiply: ['$locationMatch', JOB_WEIGHTS.locationMax] },
            '$levelFit',
            '$verifiedBonus',
            '$trustBonus',
            {
              $max: [
                0,
                {
                  $subtract: [
                    JOB_WEIGHTS.recencyMax,
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: [new Date(), { $ifNull: ['$createdAt', new Date(0)] }] },
                            86400000,
                          ],
                        },
                        JOB_WEIGHTS.recencyMax / JOB_CAPS.recencyDays,
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        location: 1,
        type: 1,
        workLevel: 1,
        workPlace: 1,
        salary: 1,
        requirements: 1,
        responsibilities: 1,
        skills: 1,
        status: 1,
        postedBy: 1,
        createdAt: 1,
        updatedAt: 1,
        company: {
          _id: '$companyObj._id',
          name: '$companyObj.name',
          logo: '$companyObj.logo',
          location: '$companyObj.location',
        },
        score: 1,
        skillsOverlap: 1,
        industryMatch: 1,
        locationMatch: 1,
      },
    },
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: poolSize },
  ];

  const jobs = await Job.aggregate(pipeline);

  return jobs
    .map((j) => ({ ...j, score: Math.round(j.score * 100) / 100 }))
    .slice(0, limit);
}

module.exports = { getPersonRecommendations, getJobRecommendations };