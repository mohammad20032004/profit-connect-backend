const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  try {
    const { title, description, category, skills, budget, deadline } = req.body;
    const project = await Project.create({
      title, description, category, skills, budget, deadline,
      client: req.user._id,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create Project Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء المشروع' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const filter = { status: 'Open' };
    if (req.query.category) filter.category = { $regex: req.query.category, $options: 'i' };
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    if (req.query.skill) filter.skills = { $in: [new RegExp(req.query.skill, 'i')] };

    if (req.query.status) {
      if (req.query.status === 'all') {
        delete filter.status;
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.mine === 'true') {
      filter.client = req.user._id;
    } else {
      filter.client = { $ne: req.user._id };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('client', 'profile.firstName profile.lastName profile.avatar');

    const total = await Project.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: projects,
    });
  } catch (error) {
    console.error('Get Projects Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب المشاريع' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'profile.firstName profile.lastName profile.avatar profile.headline')
      .populate('assignedTo', 'profile.firstName profile.lastName profile.avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }

    const proposalsCount = await Proposal.countDocuments({ project: project._id });

    const responseData = project.toObject();
    responseData.proposalsCount = proposalsCount;

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    console.error('Get Project Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بتعديل هذا المشروع' });
    }

    const allowed = ['title', 'description', 'category', 'skills', 'budget', 'deadline', 'attachments'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Update Project Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث المشروع' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بحذف هذا المشروع' });
    }

    await Proposal.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({ success: true, message: 'تم حذف المشروع وعروضه بنجاح' });
  } catch (error) {
    console.error('Delete Project Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف المشروع' });
  }
};

exports.submitProposal = async (req, res) => {
  try {
    const { bidAmount, deliveryTime, coverLetter } = req.body;

    if (!bidAmount || !deliveryTime || !coverLetter) {
      return res.status(400).json({ success: false, message: 'المبلغ ومدة التسليم ورسالة التوضيح مطلوبون' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'المشروع غير متاح للعروض حالياً' });
    }
    if (project.client.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'لا يمكنك التقديم على مشروعك الخاص' });
    }

    const existing = await Proposal.findOne({ project: project._id, freelancer: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'لقد تقدمت بعرض لهذا المشروع مسبقاً' });
    }

    const proposal = await Proposal.create({
      project: project._id,
      freelancer: req.user._id,
      bidAmount,
      deliveryTime,
      coverLetter,
    });

    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    console.error('Submit Proposal Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تقديم العرض' });
  }
};

exports.getProposalsByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك. فقط صاحب المشروع يمكنه رؤية العروض' });
    }

    const proposals = await Proposal.find({ project: project._id })
      .sort({ bidAmount: 1 })
      .populate('freelancer', 'profile.firstName profile.lastName profile.avatar profile.headline professional');

    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    console.error('Get Proposals Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'project',
        select: 'title category budget status deadline',
        populate: { path: 'client', select: 'profile.firstName profile.lastName' },
      });

    res.status(200).json({ success: true, count: proposals.length, data: proposals });
  } catch (error) {
    console.error('Get My Proposals Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.acceptProposal = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك. فقط صاحب المشروع يمكنه قبول العروض' });
    }

    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'العرض غير موجود' });
    }
    if (proposal.project.toString() !== project._id.toString()) {
      return res.status(400).json({ success: false, message: 'هذا العرض لا ينتمي لهذا المشروع' });
    }

    const otherProposals = await Proposal.find(
      { project: project._id, _id: { $ne: proposal._id } }
    );

    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposal._id } },
      { status: 'Rejected' }
    );

    proposal.status = 'Accepted';
    await proposal.save();

    const clientName = `${req.user.profile.firstName} ${req.user.profile.lastName}`;

    for (const other of otherProposals) {
      await User.findByIdAndUpdate(other.freelancer, {
        $push: {
          notifications: {
            type: 'proposal_rejected',
            projectName: project.title,
            clientName,
            projectId: project._id,
            createdAt: new Date(),
          },
        },
      });
    }

    await User.findByIdAndUpdate(proposal.freelancer, {
      $push: {
        notifications: {
          type: 'proposal_accepted',
          projectName: project.title,
          clientName,
          projectId: project._id,
          createdAt: new Date(),
        },
      },
    });

    project.status = 'InProgress';
    project.assignedTo = proposal.freelancer;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'تم قبول العرض. المشروع قيد التنفيذ',
      data: { project, proposal },
    });
  } catch (error) {
    console.error('Accept Proposal Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء قبول العرض' });
  }
};

exports.completeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك. فقط صاحب المشروع يمكنه إنهاؤه' });
    }

    project.status = 'Completed';
    await project.save();

    res.status(200).json({ success: true, message: 'تم تأكيد اكتمال المشروع', data: project });
  } catch (error) {
    console.error('Complete Project Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنهاء المشروع' });
  }
};

exports.rejectProposal = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك. فقط صاحب المشروع يمكنه رفض العروض' });
    }

    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'العرض غير موجود' });
    }
    if (proposal.project.toString() !== project._id.toString()) {
      return res.status(400).json({ success: false, message: 'هذا العرض لا ينتمي لهذا المشروع' });
    }
    if (proposal.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'يمكن رفض العروض المعلقة فقط' });
    }

    proposal.status = 'Rejected';
    await proposal.save();

    const clientName = `${req.user.profile.firstName} ${req.user.profile.lastName}`;
    await User.findByIdAndUpdate(proposal.freelancer, {
      $push: {
        notifications: {
          type: 'proposal_rejected',
          projectName: project.title,
          clientName,
          projectId: project._id,
          createdAt: new Date(),
        },
      },
    });

    res.status(200).json({ success: true, message: 'تم رفض العرض', data: proposal });
  } catch (error) {
    console.error('Reject Proposal Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء رفض العرض' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const notifications = (user.notifications || []).reverse();
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('Get Notifications Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.getRecentNotifications = async (req, res) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 15 * 1000);
    const user = await User.findById(req.user._id).select('notifications');
    const notifications = (user.notifications || []).filter(
      n => new Date(n.createdAt) >= tenMinutesAgo
    ).reverse();
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('Get Recent Notifications Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findById(req.user._id);
    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }
    notification.read = true;
    await user.save();
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark Notification Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

exports.getMyProjectsWithProposals = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const projectIds = projects.map(p => p._id);
    const proposals = await Proposal.find({ project: { $in: projectIds } })
      .populate('freelancer', 'profile.firstName profile.lastName profile.avatar profile.headline professional')
      .sort({ createdAt: -1 })
      .lean();

    const proposalsByProject = {};
    for (const prop of proposals) {
      const pid = prop.project.toString();
      if (!proposalsByProject[pid]) proposalsByProject[pid] = [];
      proposalsByProject[pid].push(prop);
    }

    const data = projects.map(p => ({
      ...p,
      proposals: proposalsByProject[p._id.toString()] || [],
      proposalsCount: proposalsByProject[p._id.toString()]?.length || 0,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Get My Projects With Proposals Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
