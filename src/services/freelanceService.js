const Proposal = require('../models/Proposal');
const Project = require('../models/Project');

// @desc    ملخّص ارتباط المستخدم بالمشاريع من الجهتين:
//  - كمستقل (Freelancer): هل قُبِل سابقاً؟ هل يعمل حالياً؟ وما المشاريع التي تقدّم لها؟
//  - كصاحب مشروع (Client): ما المشاريع التي نشرها وما حالتها؟
// @param   userId معرّف المستخدم
// @return  كائن واحد يُرفق في بيانات المستخدم تحت المفتاح freelance
async function getUserProjectSummary(userId) {
  // ===== الجانب الخاص بالمستقل (المتقدّم على المشاريع) =====
  const proposals = await Proposal.find({ freelancer: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'project',
      select: 'title category budget status deadline client progress team',
      populate: { path: 'client', select: 'profile.firstName profile.lastName profile.avatar' },
    })
    .lean();

  const accepted = proposals.filter((p) => p.status === 'Accepted');
  const activeAsFreelancer = accepted.filter(
    (p) => p.project && ['Open', 'InProgress'].includes(p.project.status)
  );

  // ===== الجانب الخاص بصاحب المشروع (العميل/صاحب العمل) =====
  const postedProjects = await Project.find({ client: userId })
    .select('title category budget status deadline progress team createdAt')
    .populate('team.freelancer', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 })
    .lean();

  const hasActiveProjectAsClient = postedProjects.some((p) =>
    ['Open', 'InProgress'].includes(p.status)
  );

  return {
    asFreelancer: {
      hasAcceptedProposal: accepted.length > 0,
      isActiveFreelancer: activeAsFreelancer.length > 0,
      acceptedCount: accepted.length,
      appliedCount: proposals.length,
      appliedProjects: proposals,
    },
    asClient: {
      postedCount: postedProjects.length,
      hasActiveProject: hasActiveProjectAsClient,
      postedProjects,
    },
  };
}

module.exports = { getUserProjectSummary };
