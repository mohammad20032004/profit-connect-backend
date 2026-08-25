/**
 * ProfitConnect - Database Seed Script
 * سكريبت حقن البيانات الضخمة
 *
 * الاستخدام:
 *   node scripts/seed.js                    → حقن بيانات افتراضية
 *   node scripts/seed.js --clear            → مسح البيانات ثم الحقن
 *   node scripts/seed.js --users 200        → تغيير عدد المستخدمين
 *   node scripts/seed.js --help             → عرض المساعدة
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const JobApplication = require('../src/models/JobApplication');
const Post = require('../src/models/Post');
const Project = require('../src/models/Project');
const Proposal = require('../src/models/Proposal');
const PlatformPayment = require('../src/models/PlatformPayment');
const MoneyTransaction = require('../src/models/MoneyTransaction');
const Withdrawal = require('../src/models/Withdrawal');
const PortfolioItem = require('../src/models/PortfolioItem');
const PortfolioCollection = require('../src/models/PortfolioCollection');
const Connection = require('../src/models/Connection');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const Salary = require('../src/models/Salary');
const ScoreHistory = require('../src/models/ScoreHistory');
const Setting = require('../src/models/Setting');

// ─── تحليل Arguments ──────────────────────────────────────
const args = process.argv.slice(2);
const FLAG = {
  clear: args.includes('--clear'),
  help: args.includes('--help'),
  getCount: (key, def) => {
    const idx = args.indexOf(key);
    return idx !== -1 ? parseInt(args[idx + 1]) || def : def;
  }
};

if (FLAG.help) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ProfitConnect - Database Seed Script              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  الاستخدام:                                                  ║
║    node scripts/seed.js [options]                            ║
║                                                              ║
║  الخيارات:                                                   ║
║    --clear                 مسح جميع البيانات قبل الحقن        ║
║    --users <number>        عدد المستخدمين (الافتراضي: 300)   ║
║    --companies <number>    عدد الشركات (الافتراضي: 60)       ║
║    --jobs <number>         عدد الوظائف (الافتراضي: 150)        ║
║    --posts <number>        عدد المنشورات (الافتراضي: 240)      ║
║    --projects <number>     عدد المشاريع (الافتراضي: 90)       ║
║    --help                  عرض المساعدة                       ║
║                                                              ║
║  مثال:                                                       ║
║    node scripts/seed.js --clear --users 1500 --companies 150  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}

const COUNTS = {
  users: FLAG.getCount('--users', 300),
  companies: FLAG.getCount('--companies', 60),
  jobs: FLAG.getCount('--jobs', 150),
  posts: FLAG.getCount('--posts', 240),
  projects: FLAG.getCount('--projects', 90),
};

// ─── بيانات مرجعية ─────────────────────────────────────────
const FIRST_NAMES_AR = ['محمد', 'أحمد', 'علي', 'فاطمة', 'خالد', 'سارة', 'عبدالله', 'نورة', 'عمر', 'ريم', 'حسن', 'منى', 'يوسف', 'هدى', 'إبراهيم', 'ليلى', 'عثمان', 'دانا', 'طارق', 'جنى', 'سلطان', 'لمياء', 'بدر', 'أريج', 'ماجد', 'سعود', 'رزان', 'قصي', 'ملاك', 'مالك'];
const FIRST_NAMES_EN = ['Mohammed', 'Ahmed', 'Ali', 'Fatima', 'Khalid', 'Sara', 'Abdullah', 'Noura', 'Omar', 'Reem', 'Hassan', 'Mona', 'Youssef', 'Huda', 'Ibrahim', 'Layla', 'Othman', 'Dana', 'Tariq', 'Jana', 'Sultan', 'Lamya', 'Badr', 'Areej', 'Majed', 'Saud', 'Razan', 'Qusai', 'Malak', 'Malek'];
const LAST_NAMES = ['العتيبي', 'القحطاني', 'الشمري', 'الدوسري', 'الحربي', 'المطيري', 'الرشيدي', 'البعيجان', 'الغامدي', 'العمري', 'الزهراني', 'السبيعي', 'الهاجري', 'الخالدي', 'العامري', 'الشرقي', 'المرزوقي'];
const LAST_NAMES_EN = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const CITIES_SA = ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الظهران', 'الخبر', 'الأحساء', 'القصيم', 'تبوك', 'حائل', 'أبها', 'جيزان', 'نجران', 'الباحة', 'عسير'];
const CITIES_GLOBAL = ['Dubai', 'Abu Dhabi', 'Cairo', 'Amman', 'Beirut', 'Istanbul', 'London', 'New York', 'San Francisco', 'Berlin'];

// إحداثيات المدن السعودية [خط العرض, خط الطول] لحقنها في شركات/مستخدمي صاحب العمل
const CITY_COORDS_SA = {
  'الرياض':  [24.7136, 46.6753],
  'جدة':     [21.4858, 39.1925],
  'مكة':     [21.3891, 39.8579],
  'المدينة': [24.5247, 39.5692],
  'الدمام':  [26.4207, 50.0888],
  'الظهران': [26.2891, 50.1506],
  'الخبر':   [26.2794, 50.2083],
  'الأحساء': [25.3791, 49.5860],
  'القصيم':  [26.3333, 43.9667],
  'تبوك':    [28.3835, 36.5662],
  'حائل':    [27.5114, 41.7209],
  'أبها':    [18.2164, 42.5053],
  'جيزان':   [16.8892, 42.5706],
  'نجران':   [17.4923, 44.1277],
  'الباحة':  [20.0124, 41.4674],
  'عسير':    [18.2164, 42.5053],
};
const INDUSTRIES = ['تطوير ويب', 'تطوير تطبيقات جوال', 'تصميم UI/UX', 'تحليل بيانات', 'ذكاء اصطناعي', 'أمن سيبراني', 'تطوير DevOps', 'قواعد بيانات', '/blockchain', 'تطوير ألعاب', 'واقع افتراضي', 'إنترنت الأشياء', 'حوسبة سحابية', 'هندسة برمجيات', 'تسويق رقمي'];
const SKILLS = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker', 'AWS', 'Figma', 'Photoshop', 'UI/UX', 'Project Management', 'Data Analysis', 'Machine Learning', 'Flutter', 'Swift', 'Kotlin', 'Java', 'C#', 'PHP', 'Laravel', 'Django', 'PostgreSQL', 'Redis', 'GraphQL', 'DevOps', 'Cyber Security', 'Blockchain', 'AR/VR', 'Content Writing'];
const POST_CONTENTS = [
  'يسعد مساكم، شاركت اليوم في مؤتمر التقنية السعودي. تجربة رائعة والتقيت بمطورين متميزين! 🚀',
  'أنهيت للتو مشروع تطوير تطبيق جوال لشركة ناشئة. كان صعب لكن النتيجة تستاهل!',
  'نصيحة للمطورين الجدد: لا تهملون التوثيق! الكود بدون توثيق مثل بيت بدون باب 📝',
  'ابحث عن مطور Full-Stack للانضمام لفريقنا. العمل عن بُعد متاح. المهارات المطلوبة: React, Node.js, MongoDB',
  'متحمس لمستقبل الذكاء الاصطناعي في السعودية. الفرص الهائلة في هذا المجال!',
  'أنجزت مهمة كبيرة في المشروع اليوم. التعاون مع الفريق كان ممتاز!',
  'من أجمل المشاريع اللي عملتها هو تطوير منصة تعليمية تفاعلية. التعليم التقني مفتاح المستقبل 🎓',
  'هل تعلم أن سوق التقنية في السعودية ينمو بنسبة 15% سنوياً؟ فرص عمل هائلة في الـ AI والـ Cloud',
  'أعلن عن افتتاح مكتبي الجديد في الرياض! مشاريعنا تركز على حلول الذكاء الاصطناعي',
  'تجربتي مع Flutter كانت رائعة: سرعة التطوير ممتازة وتجربة مستخدم ممتازة. أ recommend تجربونها!',
  'محتاج مصمم UI/UX لمشروع تجاري. الميزانية مناسبة. التواصل DM 📩',
  'أنهيت دورة في Data Science من Coursera. التعلم المستمر مفتاح النجاح 💡',
  'مبروك لفريقنا! حصلنا على تمويل بقيمة مليون دولار لتطوير منصتنا 🎉',
  'أنجزنا تطبيق جديد يربط المستقلين بالشركات. قريباً!',
  'نصيحة: ابنِ ملفك الشخصي قبل ما تقدم على وظائف. الأعمال أقوى من الشهادات!',
  'نبحث عن Senior Developer للانضمام لفريقنا المتنامي. التقديم مفتوح!',
  'أمس حضرت hackathon في جامعة الملك سعود. الإبداع عند الشباب السعودي لا يوقف! 🔥',
  'نصيحة للمطورين: حموا مشاريعكم ببراءة اختراع. حماية الفكر مهمة!',
  'رأيي في سوق العمل الحر التقني: المنافسة زادت لكن الفرص كثيرة. التميّز بالجودة هو المفتاح',
  'Project completed! ✅ تم تسليم مشروع تطوير نظام ERP لشركة كبيرة. الرضا العميل 100%',
];
const CATEGORIES = ['تطوير ويب', 'تطوير تطبيقات جوال', 'تصميم UI/UX', 'تحليل بيانات', 'أمن سيبراني', 'تطوير DevOps', 'قواعد بيانات', 'ذكاء اصطناعي', 'تطوير ألعاب', 'واقع افتراضي'];
const JOB_TITLES = ['مطور ويب Front-End', 'مطور ويب Back-End', 'مطور Full-Stack', 'مصمم UI/UX', 'محلل بيانات', 'مدير مشاريع تقنية', 'مطور تطبيقات جوال', 'مهندس DevOps', 'مطور Python', 'مطور React', 'مطور Node.js', 'محلل أمن سيبراني', 'مطور AI', 'مطور Flutter', 'مطور قواعد بيانات', 'مهندس برمجيات', 'مطور DevOps', 'مطور Kubernetes'];
const PROJECT_TITLES = ['تطوير متجر إلكتروني', 'بناء تطبيق جوال', 'تصميم واجهة مستخدم', 'تطوير نظام إدارة', 'إنشاء موقع ويب', 'تحليل بيانات العملاء', 'تطوير روبوت محادثة', 'بناء نظام ERP', 'تطوير تطبيق AI', 'بناء نظام دفع إلكتروني', 'إنشاء بوابة عمل', 'تطوير نظام DevOps', 'بناء قاعدة بيانات', 'تطوير تطبيق ألعاب', 'إنشاء منصة SaaS'];

// ─── دوال مساعدة ──────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
};
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const randDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const generatePhone = () => `+966${String(rand(50, 59))}${String(rand(1000000, 9999999))}`;
const generateEmail = (first, last, i) => {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'proton.me'];
  const asciiFirst = first.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const asciiLast = last.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const base = asciiFirst || 'user';
  const suffix = asciiLast || 'x';
  return `${base}${suffix}${i}@${pick(domains)}`;
};

function printProgress(current, total, label) {
  if (current % Math.max(1, Math.floor(total / 20)) === 0 || current === total) {
    const pct = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  ${bar} ${pct}% ${label} (${current}/${total})`);
    if (current === total) console.log('');
  }
}

// ─── مولدات البيانات ──────────────────────────────────────

async function seedUsers(count) {
  console.log(`\n🔹 جاري حقن ${count} مستخدم...`);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  const users = [];
  const roleDistribution = [
    { role: 'JobSeeker', weight: 50 },
    { role: 'FreelanceClient', weight: 20 },
    { role: 'Employer', weight: 20 },
    { role: 'CompanyEmployee', weight: 10 },
  ];

  for (let i = 0; i < count; i++) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let role = 'JobSeeker';
    for (const rd of roleDistribution) {
      cumulative += rd.weight;
      if (roll <= cumulative) { role = rd.role; break; }
    }

    const isArabic = Math.random() > 0.3;
    const gender = Math.random() > 0.45 ? 'male' : 'female';
    const firstName = isArabic ? pick(FIRST_NAMES_AR) : pick(FIRST_NAMES_EN);
    const lastName = isArabic ? pick(LAST_NAMES) : pick(LAST_NAMES_EN);
    const username = `${firstName.toLowerCase().replace(/\s/g, '')}_${Date.now()}_${i}`;

    const user = {
      email: generateEmail(firstName, lastName, i),
      password: hashedPassword,
      username,
      role,
      profile: {
        firstName,
        lastName,
        gender,
        phoneNumber: generatePhone(),
        headline: pick([
          'مطور Full-Stack | React, Node.js', 'مصمم UI/UX | Figma Expert',
          'محلل بيانات | AI Enthusiast', 'مدير مشاريع تقنية | PMP Certified',
          'مطور تطبيقات جوال | Flutter & Swift', 'مهندس DevOps | AWS Certified',
          'مطور Python | Django Expert', 'مطور React | TypeScript',
          'preneur | Building the future', 'Senior Software Engineer',
          'Data Scientist | ML Engineer', 'Product Manager | Agile',
          'Cyber Security Expert', 'Cloud Architect | Azure & AWS',
          'Mobile App Developer', 'Backend Developer | Node.js',
        ]),
        bio: pick([
          'مطور شغوف بالتكنولوجيا وأحب بناء الحلول المبتكرة. خبرة +5 سنوات في تطوير الويب والموبايل.',
          'مصمم متخصص في تجربة المستخدم. أؤمن بأن التصميم الجيد يحول التعقيد إلى بساطة.',
          'خريج هندسة الحاسب. أعمل على مشاريع AI و Machine Learning.',
          'مدير مشاريع معتمد PMP. أدارة الفرق وأdeliver المشاريع في الوقت والميزانية.',
          'Full-stack developer with 7+ years of experience. React, Node.js, Python.',
          'Mobile developer specializing in Flutter and React Native.',
          'Data analyst passionate about turning data into actionable insights.',
        ]),
        avatar: `default-avatar.png`,
        location: pick([...CITIES_SA, ...CITIES_GLOBAL]),
        socialLinks: {
          linkedin: `linkedin.com/in/${username}`,
          github: Math.random() > 0.3 ? `github.com/${username}` : '',
          website: Math.random() > 0.5 ? `https://${username}.dev` : '',
        },
        followersCount: rand(5, 500),
        followingCount: rand(3, 300),
        postsCount: rand(0, 50),
        portfolioCount: 0,
        rScore: rand(0, 2000),
      },
      professional: {
        industry: pick(INDUSTRIES),
        yearsOfExperience: rand(0, 15),
        skills: pickN(SKILLS, rand(2, 8)),
      },
      settings: {
        language: Math.random() > 0.3 ? 'ar' : 'en',
        theme: pick(['light', 'dark', 'system']),
        emailNotifications: Math.random() > 0.2,
        pushNotifications: Math.random() > 0.3,
        profileVisibility: pick(['public', 'public', 'public', 'connections', 'private']),
        showEmail: Math.random() > 0.7,
        showPhone: Math.random() > 0.8,
        animationEnabled: Math.random() > 0.1,
      },
      wallet: {
        balance: rand(0, 5000),
        holding: rand(0, 2000),
        totalEarned: rand(100, 50000),
        totalWithdrawn: rand(0, 20000),
      },
      status: 'active',
      isActive: true,
      isVerified: Math.random() > 0.3,
      createdAt: randDate(new Date('2024-01-01'), new Date()),
    };

    if (role === 'Employer') {
      user.employerProfile = {
        companyName: pick(['Tech Saudi', 'Digital Wave', 'Smart Solutions', 'Code Valley', 'Innovate Hub', 'Saudi Tech', 'Gulf Digital', 'Riyadh Labs', 'Desert Code', 'Oasis Tech']),
        companyDescription: pick(['شركة متخصصة في تطوير الحلول التقنية المبتكرة', 'startup ناشئة في مجال الذكاء الاصطناعي', 'شركة تطوير برمجيات متخصصة في الويب والموبايل', 'وكالة تطوير رقمي متخصصة في تجربة المستخدم']),
        industry: pick(INDUSTRIES),
        companyLocation: (() => {
          const eCity = pick(CITIES_SA);
          const eBase = CITY_COORDS_SA[eCity] || [24.7136, 46.6753];
          const eLat = parseFloat((eBase[0] + (Math.random() - 0.5) * 0.1).toFixed(6));
          const eLng = parseFloat((eBase[1] + (Math.random() - 0.5) * 0.1).toFixed(6));
          return {
            country: 'Saudi Arabia',
            city: eCity,
            street: pick(['شارع التحلية', 'شارع الأمير سلطان', 'شارع الملك فهد', 'شارع العليا', 'شارع الخزان']),
            buildingNumber: String(rand(1, 200)),
            coordinates: {
              type: 'Point',
              coordinates: [eLng, eLat],
            },
          };
        })(),
        companySize: pick(['1-10', '11-50', '51-200', '201-500']),
      };
    }

    users.push(user);
    printProgress(i + 1, count, 'المستخدمين');
  }

  const created = await User.insertMany(users, { ordered: false });
  console.log(`  ✅ تم إنشاء ${created.length} مستخدم`);
  return created;
}

async function seedCompanies(users, count) {
  console.log(`\n🔹 جاري حقن ${count} شركة...`);
  const employers = users.filter(u => u.role === 'Employer');
  if (employers.length === 0) {
    console.log('  ⚠️ لا يوجد أصحاب عمل. تخطي إنشاء الشركات.');
    return [];
  }

  const companyNames = [
    'Saudi Tech Solutions', 'Digital Future', 'Code Masters', 'Innovate SA', 'Gulf Software',
    'Riyadh Digital', 'Smart Systems', 'Cloud Arabia', 'Data Driven', 'AI Hub KSA',
    'Web Craft', 'Mobile First', 'Cyber Shield', 'Fintech Saudi', 'EduTech Arabia',
    'RoboTech SA', 'SpaceTech Gulf', 'Quantum Tech KSA', 'DevOps Saudi', 'Database Masters',
  ];

  const companies = [];
  const employerUpdates = [];
  for (let i = 0; i < Math.min(count, employers.length); i++) {
    const owner = employers[i];
    const statusPool = ['Approved', 'Approved', 'Approved', 'Pending', 'Rejected'];
    const companyName = companyNames[i % companyNames.length] + (i >= companyNames.length ? ` ${Math.floor(i / companyNames.length) + 1}` : '');
    const city = pick(CITIES_SA);
    const baseCoords = CITY_COORDS_SA[city] || [24.7136, 46.6753];
    // إزاحة عشوائية صغيرة حول مركز المدينة لإضفاء واقعية (±0.05 درجة تقريباً)
    const lat = parseFloat((baseCoords[0] + (Math.random() - 0.5) * 0.1).toFixed(6));
    const lng = parseFloat((baseCoords[1] + (Math.random() - 0.5) * 0.1).toFixed(6));
    const company = {
      name: companyName,
      description: pick([
        'شركة متخصصة في تطوير الحلول التقنية المبتكرة. نقدم خدمات تطوير الويب والموبايل والذكاء الاصطناعي.',
        'شركة هندسة برمجيات متخصصة في الحلول المؤسسية. نطور تطبيقات ويب وموبايل متكاملة.',
        'شركة ناشئة في مجال التكنولوجيا المالية. نبني حلول دفع إلكتروني آمنة وسريعة.',
        'منصة تعليمية تقنية متخصصة في تقديم دورات برمجية عالية الجودة. أكثر من 50,000 متعلم.',
        'شركة هندسة برمجيات متخصصة في الحلول السحابية. خبرة +10 سنوات في السوق.',
        'مركز بيانات ومعالجة معلومات. نوفر خدمات السحابة والخوادم للمؤسسات.',
      ]),
      industry: pick(INDUSTRIES),
      location: {
        country: 'Saudi Arabia',
        city,
        street: pick(['شارع التحلية', 'شارع الأمير سلطان', 'شارع الملك فهد', 'شارع العليا', 'شارع الخزان']),
        buildingNumber: String(rand(1, 200)),
        coordinates: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
      companySize: pick(['1-10', '11-50', '51-200', '201-500', '501-1000']),
      foundedYear: rand(2010, 2025),
      website: `https://${companyName.toLowerCase().replace(/\s/g, '')}.com`,
      contactEmail: `info@${companyName.toLowerCase().replace(/\s/g, '')}.com`,
      status: pick(statusPool),
      isVerified: Math.random() > 0.4,
      owner: owner._id,
      followersCount: rand(10, 2000),
      averageRating: randFloat(2.5, 5.0),
    };
    companies.push(company);
    employerUpdates.push({
      updateOne: {
        filter: { _id: owner._id },
        update: { $set: { 'employerProfile.companyName': companyName } }
      }
    });
    printProgress(i + 1, count, 'الشركات');
  }

  const created = await Company.insertMany(companies, { ordered: false });
  if (employerUpdates.length > 0) {
    await User.bulkWrite(employerUpdates, { ordered: false });
  }
  console.log(`  ✅ تم إنشاء ${created.length} شركة`);
  return created;
}

async function seedJobs(companies, users, count) {
  console.log(`\n🔹 جاري حقن ${count} وظيفة...`);
  if (companies.length === 0) return [];
  const approvedCompanies = companies.filter(c => c.status === 'Approved');
  if (approvedCompanies.length === 0) return [];

  const jobs = [];
  for (let i = 0; i < count; i++) {
    const company = pick(approvedCompanies);
    const employer = users.find(u => u._id.toString() === company.owner.toString());
    if (!employer) continue;

    const minSal = rand(3000, 15000);
    jobs.push({
      title: pick(JOB_TITLES),
      description: pick([
        'نبحث عن مطور متميز للانضمام لفريقنا. المطلوب خبرة لا تقل عن 3 سنوات في تطوير الويب.',
        'مطلوب مصمم UI/UX لإعادة تصميم منصتنا. خبرة في Figma وأدوات التصميم مطلوبة.',
        'نبحث عن محلل بيانات لتحليل بيانات العملاء وتقديم تقارير ذكية.',
        'مطلوب مدير مشاريع تقنية لإدارة فريق تطوير. شهادة PMP مفضّلة.',
        'نحتاج مطور تطبيقات جوال لبناء تطبيقات عابرة للمنصات.',
        'مطلوب مهندس DevOps لإدارة البنية التحتية السحابية. خبرة AWS أو Azure.',
        'نبحث عن مطور AI لبناء نماذج تعلم الآلة ودمجها في منصتنا.',
        'مطلوب مطور قواعد بيانات لإدارة وتحسين أداء قواعد البيانات.',
      ]),
      company: company._id,
      location: `${company.location.city}, ${company.location.country}`,
      type: pick(['Full-time', 'Full-time', 'Full-time', 'Part-time', 'Contract', 'Freelance']),
      workLevel: pick(['Entry', 'Mid', 'Mid', 'Senior', 'Director']),
      workPlace: pick(['On-site', 'Remote', 'Remote', 'Hybrid']),
      salary: { min: minSal, max: minSal + rand(2000, 10000), currency: 'USD' },
      requirements: pickN([
        'خبرة 3+ سنوات في تطوير الويب', 'إجادة React و Node.js', 'خبرة في MongoDB أو PostgreSQL',
        'فهم جيد لـ REST APIs', 'خبرة في Git', 'مهارات تواصل ممتازة', 'شهادة بكالوريوس هندسة حاسب',
        'خبرة في Agile/Scrum', 'إجادة اللغة الإنجليزية', 'خبرة في Docker و Kubernetes',
        'فهم أمن المعلومات', 'خبرة في CI/CD', 'قدرة على العمل ضمن فريق',
      ], rand(3, 6)),
      responsibilities: pickN([
        'تطوير وصيانة تطبيقات الويب', 'المشاركة في مراجعات الكود', 'كتابة وحدات اختبار',
        'العمل مع فريق التصميم', 'تحسين أداء التطبيقات', 'توثيق الكود',
        'المشاركة في اجتماعات Sprint', 'تدريب المطورين الجدد',
      ], rand(3, 5)),
      status: pick(['Open', 'Open', 'Open', 'Closed']),
      postedBy: employer._id,
    });
    printProgress(i + 1, count, 'الوظائف');
  }

  const created = await Job.insertMany(jobs);
  console.log(`  ✅ تم إنشاء ${created.length} وظيفة`);
  return created;
}

async function seedJobApplications(jobs, users, count) {
  console.log(`\n🔹 جاري حقن ${count} طلب وظيفة...`);
  if (jobs.length === 0) return [];
  const jobSeekers = users.filter(u => u.role === 'JobSeeker');
  if (jobSeekers.length === 0) return [];

  const applications = [];
  const usedPairs = new Set();
  for (let i = 0; i < count; i++) {
    const job = pick(jobs);
    const applicant = pick(jobSeekers);
    const key = `${job._id}-${applicant._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    applications.push({
      job: job._id,
      applicant: applicant._id,
      coverLetter: pick([
        'أنا متحمس للانضمام لفريقكم. لدي خبرة واسعة في المطلوب وأستطيع المساهمة بشكل فوري.',
        'أبحث عن فرصة لتطوير مهاراتي والمساهمة في مشاريع مبتكرة. أنا متعلم سريع ومتحمس.',
        'لدي خبرة +5 سنوات في هذا المجال. أستطيع تقديم إضافة حقيقية لفريقكم.',
        'أرى أن هذه الفرصة تتوافق تماماً مع خبراتي ومهاراتي. أتطلع للانضمام.',
      ]),
      status: pick(['Pending', 'Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Accepted']),
    });
    printProgress(i + 1, count, 'طلبات الوظائف');
  }

  const created = await JobApplication.insertMany(applications);
  console.log(`  ✅ تم إنشاء ${created.length} طلب وظيفة`);
  return created;
}

async function seedPosts(users, count) {
  console.log(`\n🔹 جاري حقن ${count} منشور...`);
  const posts = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const likesCount = rand(0, Math.min(50, users.length - 1));
    const likers = pickN(users.filter(u => u._id.toString() !== user._id.toString()), likesCount).map(u => u._id);
    const commentsCount = rand(0, 8);
    const comments = [];
    for (let j = 0; j < commentsCount; j++) {
      const commenter = pick(users.filter(u => u._id.toString() !== user._id.toString()));
      comments.push({
        user: commenter._id,
        content: pick([
          'محتوى رائع! 👏', 'شكراً على المشاركة', 'معلومة مفيدة جداً',
          'أوافقك الرأي تماماً', 'هل يمكنك مشاركة المزيد من التفاصيل؟',
          'هذا بالضبط ما كنت أبحث عنه', 'عمل مميز! استمر', 'متحمس للمتابعة!',
          'Cool! Thanks for sharing', 'Great insight!', 'Well said!',
        ]),
        createdAt: randDate(new Date('2025-01-01'), new Date()),
      });
    }

    posts.push({
      user: user._id,
      content: pick(POST_CONTENTS),
      visibility: pick(['public', 'public', 'public', 'private']),
      likes: likers,
      comments,
      aiProbability: Math.random() > 0.7 ? randFloat(0, 30) : null,
    });
    printProgress(i + 1, count, 'المنشورات');
  }

  const created = await Post.insertMany(posts);
  console.log(`  ✅ تم إنشاء ${created.length} منشور`);
  return created;
}

async function seedProjects(users, count) {
  console.log(`\n🔹 جاري حقن ${count} مشروع...`);
  const clients = users.filter(u => ['FreelanceClient', 'Employer'].includes(u.role));
  const freelancers = users.filter(u => ['JobSeeker', 'FreelanceClient'].includes(u.role));
  if (clients.length === 0 || freelancers.length === 0) {
    console.log('  ⚠️ لا يوجد عملاء أو مستقلين كافيين. تخطي.');
    return [];
  }

  const projects = [];
  for (let i = 0; i < count; i++) {
    const client = pick(clients);
    const statuses = ['Open', 'Open', 'InProgress', 'InProgress', 'Completed', 'Cancelled'];
    const status = pick(statuses);
    const startDate = status !== 'Open' ? randDate(new Date('2025-06-01'), new Date()) : undefined;
    const milestonesCount = rand(2, 5);
    const milestones = [];
    for (let m = 0; m < milestonesCount; m++) {
      milestones.push({
        title: `مرحلة ${m + 1}: ${pick(['التخطيط', 'التصميم', 'التطوير', 'الاختبار', 'الإطلاق'])}`,
        description: pick(['تصميم الواجهة الأولية', 'تطوير الbackend', 'اختبار الأداء', 'النشر النهائي']),
        startDate: startDate ? new Date(startDate.getTime() + m * 7 * 24 * 60 * 60 * 1000) : undefined,
        endDate: startDate ? new Date(startDate.getTime() + (m + 1) * 7 * 24 * 60 * 60 * 1000) : undefined,
        status: pick(['NotStarted', 'InProgress', 'Completed']),
        progress: rand(0, 100),
      });
    }

    const budgetMin = rand(1000, 10000);
    projects.push({
      title: pick(PROJECT_TITLES) + ` #${i + 1}`,
      description: pick([
        'نبحث عن مطور متمرس لبناء تطبيق ويب متكامل. المشروع يتطلب خبرة في React و Node.js.',
        'مطلوب مصمم UI/UX لإنشاء واجهة مستخدم حديثة لمنصتنا التقنية.',
        'نحتاج تطوير نظام إدارة محتوى مخصص. النظام يجب أن يدعم GraphQL.',
        'مشروع تطوير تطبيق جوال باستخدام Flutter. التطبيق يتصل بـ API موجود.',
        'نبحث عن محلل بيانات لتحليل بيانات المستخدمين وتقديم تقارير ذكية.',
      ]),
      category: pick(CATEGORIES),
      skills: pickN(SKILLS, rand(3, 6)),
      budget: { min: budgetMin, max: budgetMin + rand(2000, 20000), currency: 'USD' },
      deadline: Math.random() > 0.4 ? rand(1, 12) : null,
      status,
      client: client._id,
      assignedTo: status !== 'Open' ? pick(freelancers)._id : null,
      progress: status === 'Completed' ? 100 : status === 'InProgress' ? rand(10, 90) : 0,
      milestones,
      paymentsConfig: {
        twoStage: true,
        installmentsCount: 2,
        totalAmount: budgetMin + rand(1000, 10000),
      },
      publishedAt: randDate(new Date('2025-01-01'), new Date()),
      startDate,
      team: status !== 'Open' ? [{
        freelancer: pick(freelancers)._id,
        role: pick(['مطور رئيسي', 'مصمم', 'محلل']),
        status: pick(['Working', 'Completed']),
        joinedAt: startDate || new Date(),
      }] : [],
    });
    printProgress(i + 1, count, 'المشاريع');
  }

  const created = await Project.insertMany(projects);
  console.log(`  ✅ تم إنشاء ${created.length} مشروع`);
  return created;
}

async function seedProposals(projects, users, count) {
  console.log(`\n🔹 جاري حقن ${count} عرض سعر...`);
  if (projects.length === 0) return [];
  const freelancers = users.filter(u => ['JobSeeker', 'FreelanceClient'].includes(u.role));
  if (freelancers.length === 0) return [];

  const proposals = [];
  const usedPairs = new Set();
  for (let i = 0; i < count; i++) {
    const project = pick(projects);
    const freelancer = pick(freelancers);
    const key = `${project._id}-${freelancer._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    proposals.push({
      project: project._id,
      freelancer: freelancer._id,
      bidAmount: rand(500, 30000),
      deliveryTime: pick(['1 أسبوع', '2 أسبوع', '3 أسابيع', 'شهر', '6 أسابيع', 'شهرين']),
      coverLetter: pick([
        'أنا متحمس لهذا المشروع. لدي خبرة واسعة في هذا المجال وأستطيع تسليم_work بجودة عالية.',
        '项目 هذا يناسب مهاراتي تماماً. يمكنني البدء فوراً vàسليم في الوقت المحدد.',
        'لدي портфوليو من مشاريع مشابهة. أستطيع إكمال هذا المشروع بـ budget مناسب.',
        'أقدم لك خبرتي في هذا المجال. سأعمل بجد لتلبية توقعاتك وتاكد من رضاك.',
      ]),
      status: pick(['Pending', 'Pending', 'Accepted', 'Rejected']),
    });
    printProgress(i + 1, count, 'عروض الأسعار');
  }

  const created = await Proposal.insertMany(proposals);
  console.log(`  ✅ تم إنشاء ${created.length} عرض سعر`);
  return created;
}

async function seedPlatformPayments(projects, users, proposals, count) {
  console.log(`\n🔹 جاري حقن ${count} دفعة منصية...`);
  if (projects.length === 0) return [];

  const payments = [];
  for (let i = 0; i < count; i++) {
    const project = pick(projects.filter(p => p.status !== 'Open'));
    if (!project) continue;
    const client = users.find(u => u._id.toString() === project.client.toString());
    if (!client) continue;
    const payee = project.assignedTo ? users.find(u => u._id.toString() === project.assignedTo.toString()) : pick(users);
    if (!payee) continue;

    const amount = rand(1000, 50000);
    const fee = Math.round(amount * 0.1);
    payments.push({
      project: project._id,
      payer: client._id,
      payee: payee._id,
      amount,
      method: pick(['PayPal', 'Visa', 'Mastercard', 'Apple Pay']),
      fee,
      netAmount: amount - fee,
      status: pick(['held', 'released', 'released', 'refunded']),
    });
    printProgress(i + 1, count, 'الدفعات المنصية');
  }

  const created = await PlatformPayment.insertMany(payments);
  console.log(`  ✅ تم إنشاء ${created.length} دفعة منصية`);
  return created;
}

async function seedMoneyTransactions(users, platformPayments, count) {
  console.log(`\n🔹 جاري حقن ${count} معاملة مالية...`);

  const transactions = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const types = ['deposit', 'release', 'fee', 'refund', 'withdraw', 'withdraw_processed', 'manual'];
    const type = pick(types);
    const amount = type === 'fee' ? -rand(10, 500) : rand(100, 20000);
    const payment = Math.random() > 0.5 ? pick(platformPayments) : null;

    transactions.push({
      user: user._id,
      type,
      amount,
      balanceAfter: rand(0, 10000),
      platformPayment: payment ? payment._id : null,
      description: pick([
        'إيداع مبلغ', 'صرف ربح مشروع', 'رسوم منصة', 'استرداد مبلغ',
        'سحب نقدي', 'إيداع يدوي', 'عمولة إحالة',
      ]),
    });
    printProgress(i + 1, count, 'المعاملات المالية');
  }

  const created = await MoneyTransaction.insertMany(transactions);
  console.log(`  ✅ تم إنشاء ${created.length} معاملة مالية`);
  return created;
}

async function seedWithdrawals(users, count) {
  console.log(`\n🔹 جاري حقن ${count} طلب سحب...`);
  const withdrawals = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    withdrawals.push({
      user: user._id,
      amount: rand(500, 20000),
      method: pick(['bank_transfer', 'bank_transfer', 'cash', 'other']),
      accountDetails: {
        bankName: pick(['الراجحي', 'البنك الأهلي', ' Riyad Bank', 'البنك السعودي', 'ING']),
        iban: `SA${rand(10, 99)}${String(rand(10000000000, 99999999999))}`,
        accountNumber: String(rand(100000000, 999999999)),
        holderName: user.profile?.fullname || 'User',
      },
      status: pick(['pending', 'pending', 'processed', 'processed', 'rejected']),
      adminNote: pick(['تمت المعالجة', 'بانتظار التحقق', ''] ),
    });
    printProgress(i + 1, count, 'طلبات السحب');
  }

  const created = await Withdrawal.insertMany(withdrawals);
  console.log(`  ✅ تم إنشاء ${created.length} طلب سحب`);
  return created;
}

async function seedPortfolioItems(users, count) {
  console.log(`\n🔹 جاري حقن ${count} عمل محفظة...`);
  const items = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const likesCount = rand(0, 30);
    const likers = pickN(users.filter(u => u._id.toString() !== user._id.toString()), likesCount).map(u => u._id);

    items.push({
      user: user._id,
      title: pick([
        'تصميم متجر إلكتروني', 'تطبيق جوال للمطاعم', 'لوحة تحكم تحليلية',
        'موقع شخصي احترافي', 'تطبيق إدارة المهام', 'تصميم واجهة مستخدم',
        'نظام إدارة محتوى', 'تطبيق توصيل', 'بوت محادثة ذكي',
        'لوحة تحكم Data Science', 'نظام نقاط بيع', 'تطبيق SaaS',
      ]),
      description: pick([
        'تصميم وتطوير متجر إلكتروني متكامل مع نظام دفع وسلة مشتريات.',
        'تطبيق جوال يعمل على iOS و Android مبني بـ Flutter.',
        'لوحة تحكم تفاعلية لعرض بيانات التحليلات والرسوم البيانية.',
        'موقع شخصي احترافي يعرض الأعمال والمهارات التقنية.',
      ]),
      category: pick(CATEGORIES),
      tags: pickN(['web', 'mobile', 'design', 'AI', 'ui-ux', 'react', 'flutter', 'nodejs', 'python', 'figma'], rand(2, 5)),
      skills: pickN(SKILLS, rand(2, 5)),
      visibility: pick(['public', 'public', 'public', 'private']),
      isFeatured: Math.random() > 0.8,
      views: rand(10, 500),
      likes: likers,
      media: Array.from({ length: rand(1, 4) }, (_, idx) => ({
        url: `https://picsum.photos/seed/${Date.now()}_${idx}/800/600`,
        type: pick(['image', 'image', 'video']),
        order: idx,
      })),
    });
    printProgress(i + 1, count, 'أعمال المحفظة');
  }

  const created = await PortfolioItem.insertMany(items);
  console.log(`  ✅ تم إنشاء ${created.length} عمل محفظة`);
  return created;
}

async function seedPortfolioCollections(users, portfolioItems, count) {
  console.log(`\n🔹 جاري حقن ${count} مجموعة محفظة...`);
  const collections = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const userItems = portfolioItems.filter(p => p.user.toString() === user._id.toString());
    const itemCount = Math.min(rand(2, 6), userItems.length);
    const selectedItems = pickN(userItems, itemCount).map(p => p._id);

    collections.push({
      user: user._id,
      name: pick(['مشاريع الويب', 'تطبيقات الموبايل', 'تصميمات UI/UX', 'مشاريع مكتملة', 'أعمال حديثة', 'مشاريع شخصية', 'عمل حر']),
      description: pick(['مجموعة من أعمالي في تطوير الويب', 'تطبيقات جوال صممتها', 'تصميمات واجهات مستخدم']),
      items: selectedItems,
      isPublic: Math.random() > 0.2,
    });
    printProgress(i + 1, count, 'مجموعات المحفظة');
  }

  const created = await PortfolioCollection.insertMany(collections);
  console.log(`  ✅ تم إنشاء ${created.length} مجموعة محفظة`);
  return created;
}

async function seedConnections(users, count) {
  console.log(`\n🔹 جاري حقن ${count} اتصال...`);
  const connections = [];
  const usedPairs = new Set();
  for (let i = 0; i < count; i++) {
    const requester = pick(users);
    const recipient = pick(users.filter(u => u._id.toString() !== requester._id.toString()));
    const key = [requester._id.toString(), recipient._id.toString()].sort().join('-');
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    connections.push({
      requester: requester._id,
      recipient: recipient._id,
      status: pick(['pending', 'accepted', 'accepted', 'rejected']),
    });
    printProgress(i + 1, count, 'الاتصالات');
  }

  const created = await Connection.insertMany(connections);
  console.log(`  ✅ تم إنشاء ${created.length} اتصال`);
  return created;
}

async function seedConversationsAndMessages(users, count) {
  console.log(`\n🔹 جاري حقن ${count} محادثة مع رسائل...`);
  const conversations = [];
  const messagesToInsert = [];
  const usedPairs = new Set();

  for (let i = 0; i < count; i++) {
    const user1 = pick(users);
    const user2 = pick(users.filter(u => u._id.toString() !== user1._id.toString()));
    const key = [user1._id.toString(), user2._id.toString()].sort().join('-');
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const msgCount = rand(2, 20);
    const messages = [];
    for (let j = 0; j < msgCount; j++) {
      const sender = j % 2 === 0 ? user1 : user2;
      messages.push({
        sender: sender._id,
        content: pick([
          'مرحبا، كيف حالك؟', 'أهلاً! بخير الحمد لله', 'هل شفت المشروع الجديد؟',
          'نعم، يبدو ممتازاً', 'متى نقدر نبدأ؟', 'خلنا نبدأ الأسبوع الجاي',
          'تمام، أنا جاهز', 'أرسل لي التفاصيل', 'شكراً جزيلاً',
          'لا شكر على واجب', 'هل عندك وقت للقاء؟', 'بكرة الساعة 3 مناسبة؟',
          'ممتاز، نتفق على ذلك', 'تمام، مع السلامة', 'باي!',
          'Hi! How are you?', 'I\'m good, thanks!', 'Check out this project',
          'Looks great! When do we start?', 'Let me send you the details',
        ]),
        createdAt: randDate(new Date('2025-06-01'), new Date()),
        isRead: Math.random() > 0.3,
      });
    }

    conversations.push({
      participants: [user1._id, user2._id],
      lastMessageAt: messages[messages.length - 1].createdAt,
    });
    printProgress(i + 1, count, 'المحادثات');
  }

  const createdConversations = await Conversation.insertMany(conversations);
  console.log(`  ✅ تم إنشاء ${createdConversations.length} محادثة`);

  // حقن الرسائل مع ربطها بالمحادثات
  console.log(`  🔹 جاري حقن الرسائل...`);
  const allMessages = [];
  for (let i = 0; i < createdConversations.length; i++) {
    const conv = createdConversations[i];
    const msgCount = rand(2, 15);
    for (let j = 0; j < msgCount; j++) {
      allMessages.push({
        conversation: conv._id,
        sender: pick(conv.participants),
        content: pick([
          'مرحباً!', 'كيف حالك؟', 'بخير الحمد لله', 'هل شفت الرسالة؟',
          'نعم، أراجعها الآن', 'تمام، لا عجلة', 'شكراً جزيلاً',
          'على الرحب والسعة', 'هل نكمل؟', 'بالتأكيد!',
          'Hello!', 'How\'s it going?', 'All good!', 'Thanks!',
          'Let me check and get back to you', 'Sure, take your time',
        ]),
        isRead: Math.random() > 0.2,
        createdAt: randDate(new Date('2025-06-01'), new Date()),
      });
    }
  }
  await Message.insertMany(allMessages);
  console.log(`  ✅ تم إنشاء ${allMessages.length} رسالة`);
  return createdConversations;
}

async function seedSalaries() {
  console.log(`\n🔹 جاري حقن بيانات الرواتب...`);
  const titles = ['مطور ويب', 'مصمم UI/UX', 'مدير مشاريع تقنية', 'محلل بيانات', 'مطور تطبيقات جوال', 'مهندس DevOps', 'مطور AI', 'مطور قواعد بيانات', 'مهندس أمن سيبراني', 'مطور Full-Stack', 'مطور Flutter', 'مطور Python'];
  const countries = ['Saudi Arabia', 'UAE', 'Egypt', 'Jordan', 'Lebanon', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'UK', 'USA', 'Germany'];
  const levels = ['Entry', 'Mid', 'Senior'];

  const salaries = [];
  for (const title of titles) {
    for (const country of countries) {
      for (const level of levels) {
        const base = level === 'Entry' ? rand(2000, 4000) : level === 'Mid' ? rand(5000, 10000) : rand(12000, 25000);
        const spread = rand(1000, 5000);
        salaries.push({
          title,
          category: pick(['تطوير ويب', 'تطوير جوال', 'تصميم UI/UX', 'DevOps', 'أمن سيبراني']),
          country,
          experienceLevel: level,
          minSalaryUSD: base,
          maxSalaryUSD: base + spread,
          medianSalaryUSD: base + Math.round(spread / 2),
        });
      }
    }
  }

  const created = await Salary.insertMany(salaries);
  console.log(`  ✅ تم إنشاء ${created.length} سجل راتب`);
  return created;
}

async function seedScoreHistory(users, count) {
  console.log(`\n🔹 جاري حقن ${count} سجل سمعة...`);
  const actions = ['ADD_PORTFOLIO_ITEM', 'RECEIVE_PORTFOLIO_LIKE', 'COMPLETE_PROJECT', 'GET_5_STAR_RATING', 'FIRST_LOGIN', 'UPDATE_PROFILE', 'ADD_POST', 'POST_LIKE_RECEIVED', 'CONNECTION_MADE', 'JOB_APPLICATION'];

  const records = [];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const action = pick(actions);
    const points = action === 'ADD_PORTFOLIO_ITEM' ? 10 : action === 'COMPLETE_PROJECT' ? 50 : rand(1, 20);
    records.push({
      user: user._id,
      actionKey: action,
      points,
      description: pick([
        'إضافة عمل للمحفظة', 'استقبال إعجاب', 'إكمال مشروع', 'تقييم 5 نجوم',
        'تسجيل دخول أول', 'تحديث الملف الشخصي', 'نشر منشور', 'استقبال إعجاب على منشور',
        'إنشاء اتصال', 'تقديم على وظيفة',
      ]),
    });
    printProgress(i + 1, count, 'سجل السمعة');
  }

  const created = await ScoreHistory.insertMany(records);
  console.log(`  ✅ تم إنشاء ${created.length} سجل سمعة`);
  return created;
}

async function seedPlatformSettings() {
  console.log(`\n🔹 جاري حقن إعدادات المنصة...`);
  const settings = [
    { key: 'platform_commission_rate', value: 0.1 },
    { key: 'min_withdrawal_amount', value: 100 },
    { key: 'max_portfolio_items_per_user', value: 50 },
    { key: 'ai_detection_threshold', value: 70 },
    { key: 'max_job_applications_per_day', value: 20 },
    { key: 'free_project_postings', value: 3 },
    { key: 'currency', value: 'USD' },
    { key: 'maintenance_mode', value: false },
    { key: 'registration_enabled', value: true },
    { key: 'support_email', value: 'support@profitconnect.com' },
  ];

  const bulkOps = settings.map(s => ({
    updateOne: { filter: { key: s.key }, update: { $set: s }, upsert: true }
  }));
  await Setting.bulkWrite(bulkOps, { ordered: false });
  console.log(`  ✅ تم إنشاء ${settings.length} إعداد منصة`);
}

async function updateFollowCounts(users) {
  console.log(`\n🔹 جاري تحديث عدادات المتابعين...`);
  const connections = await Connection.find({ status: 'accepted' }).lean();
  const bulkOps = [];
  for (const conn of connections) {
    bulkOps.push({
      updateOne: {
        filter: { _id: conn.requester },
        update: { $addToSet: { 'profile.following': conn.recipient }, $inc: { 'profile.followingCount': 1 } }
      }
    });
    bulkOps.push({
      updateOne: {
        filter: { _id: conn.recipient },
        update: { $addToSet: { 'profile.followers': conn.requester }, $inc: { 'profile.followersCount': 1 } }
      }
    });
  }
  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps, { ordered: false });
  }
  console.log(`  ✅ تم تحديث العدادات بناءً على ${connections.length} اتصال مقبول`);
}

async function updatePortfolioCounts(users, portfolioItems) {
  console.log(`\n🔹 جاري تحديث عدادات المحفظة...`);
  const counts = {};
  for (const item of portfolioItems) {
    const userId = item.user.toString();
    counts[userId] = (counts[userId] || 0) + 1;
  }
  const bulkOps = Object.entries(counts).map(([userId, count]) => ({
    updateOne: { filter: { _id: userId }, update: { $set: { 'profile.portfolioCount': count } } }
  }));
  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps, { ordered: false });
  }
  console.log(`  ✅ تم تحديث عدادات المحفظة`);
}

async function updatePostCounts(users, posts) {
  console.log(`\n🔹 جاري تحديث عدادات المنشورات...`);
  const counts = {};
  for (const post of posts) {
    const userId = post.user.toString();
    counts[userId] = (counts[userId] || 0) + 1;
  }
  const bulkOps = Object.entries(counts).map(([userId, count]) => ({
    updateOne: { filter: { _id: userId }, update: { $set: { 'profile.postsCount': count } } }
  }));
  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps, { ordered: false });
  }
  console.log(`  ✅ تم تحديث عدادات المنشورات`);
}

// ─── التشغيل الرئيسي ─────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         ProfitConnect - Database Seed Script                ║
║         سكريبت حقن البيانات الضخمة                         ║
╚══════════════════════════════════════════════════════════════╝

  الإعدادات:
    المستخدمين:    ${COUNTS.users}
    الشركات:       ${COUNTS.companies}
    الوظائف:       ${COUNTS.jobs}
    المنشورات:     ${COUNTS.posts}
    المشاريع:      ${COUNTS.projects}
    المسح قبل الحقن: ${FLAG.clear ? 'نعم' : 'لا'}
  `);

  try {
    console.log('⏳ جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات\n');

    if (FLAG.clear) {
      console.log('🗑️  جاري مسح جميع البيانات...');
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      console.log('✅ تم مسح جميع البيانات\n');
    }

    // ─── 1. المستخدمون ───
    const users = await seedUsers(COUNTS.users);

    // ─── 2. الشركات ───
    const companies = await seedCompanies(users, COUNTS.companies);

    // ─── 3. الوظائف ───
    const jobs = await seedJobs(companies, users, COUNTS.jobs);

    // ─── 4. طلبات الوظائف ───
    const jobApps = await seedJobApplications(jobs, users, Math.floor(COUNTS.jobs * 3));

    // ─── 5. المنشورات ───
    const posts = await seedPosts(users, COUNTS.posts);

    // ─── 6. المشاريع ───
    const projects = await seedProjects(users, COUNTS.projects);

    // ─── 7. عروض الأسعار ───
    const proposals = await seedProposals(projects, users, Math.floor(COUNTS.projects * 4));

    // ─── 8. الدفعات المنصية ───
    const platformPayments = await seedPlatformPayments(projects, users, proposals, Math.floor(COUNTS.projects * 2));

    // ─── 9. المعاملات المالية ───
    await seedMoneyTransactions(users, platformPayments, Math.floor(COUNTS.users * 2));

    // ─── 10. طلبات السحب ───
    await seedWithdrawals(users, Math.floor(COUNTS.users * 0.3));

    // ─── 11. أعمال المحفظة ───
    const portfolioItems = await seedPortfolioItems(users, Math.floor(COUNTS.users * 1.5));

    // ─── 12. مجموعات المحفظة ───
    await seedPortfolioCollections(users, portfolioItems, Math.floor(COUNTS.users * 0.5));

    // ─── 13. الاتصالات ───
    await seedConnections(users, Math.floor(COUNTS.users * 2));

    // ─── 14. المحادثات والرسائل ───
    await seedConversationsAndMessages(users, Math.floor(COUNTS.users * 0.5));

    // ─── 15. بيانات الرواتب ───
    await seedSalaries();

    // ─── 16. سجل السمعة ───
    await seedScoreHistory(users, Math.floor(COUNTS.users * 3));

    // ─── 17. إعدادات المنصة ───
    await seedPlatformSettings();

    // ─── تحديث العدادات ───
    await updateFollowCounts(users);
    await updatePortfolioCounts(users, portfolioItems);
    await updatePostCounts(users, posts);

    // ─── ملخص ───
    const stats = {
      users: await User.countDocuments(),
      companies: await Company.countDocuments(),
      jobs: await Job.countDocuments(),
      jobApplications: await JobApplication.countDocuments(),
      posts: await Post.countDocuments(),
      projects: await Project.countDocuments(),
      proposals: await Proposal.countDocuments(),
      platformPayments: await PlatformPayment.countDocuments(),
      moneyTransactions: await MoneyTransaction.countDocuments(),
      withdrawals: await Withdrawal.countDocuments(),
      portfolioItems: await PortfolioItem.countDocuments(),
      portfolioCollections: await PortfolioCollection.countDocuments(),
      connections: await Connection.countDocuments(),
      conversations: await Conversation.countDocuments(),
      messages: await Message.countDocuments(),
      salaries: await Salary.countDocuments(),
      scoreHistory: await ScoreHistory.countDocuments(),
      settings: await Setting.countDocuments(),
    };

    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ✅ تمت العملية بنجاح                     ║
╠══════════════════════════════════════════════════════════════╣
║  المستخدمون:              ${String(stats.users).padStart(6)}                           ║
║  الشركات:                 ${String(stats.companies).padStart(6)}                           ║
║  الوظائف:                 ${String(stats.jobs).padStart(6)}                           ║
║  طلبات الوظائف:           ${String(stats.jobApplications).padStart(6)}                           ║
║  المنشورات:               ${String(stats.posts).padStart(6)}                           ║
║  المشاريع:                ${String(stats.projects).padStart(6)}                           ║
║  عروض الأسعار:            ${String(stats.proposals).padStart(6)}                           ║
║  الدفعات المنصية:         ${String(stats.platformPayments).padStart(6)}                           ║
║  المعاملات المالية:        ${String(stats.moneyTransactions).padStart(6)}                           ║
║  طلبات السحب:             ${String(stats.withdrawals).padStart(6)}                           ║
║  أعمال المحفظة:            ${String(stats.portfolioItems).padStart(6)}                           ║
║  مجموعات المحفظة:         ${String(stats.portfolioCollections).padStart(6)}                           ║
║  الاتصالات:               ${String(stats.connections).padStart(6)}                           ║
║  المحادثات:               ${String(stats.conversations).padStart(6)}                           ║
║  الرسائل:                 ${String(stats.messages).padStart(6)}                           ║
║  بيانات الرواتب:          ${String(stats.salaries).padStart(6)}                           ║
║  سجل السمعة:              ${String(stats.scoreHistory).padStart(6)}                           ║
║  إعدادات المنصة:          ${String(stats.settings).padStart(6)}                           ║
╠══════════════════════════════════════════════════════════════╣
║  المجموع الكلي:           ${String(total).padStart(6)}                           ║
╚══════════════════════════════════════════════════════════════╝
`);

  } catch (error) {
    console.error('\n❌ خطأ أثناء الحقن:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

main();
