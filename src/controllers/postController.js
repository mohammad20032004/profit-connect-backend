const Post = require('../models/Post');

// @desc    إنشاء منشور جديد
// @route   POST /api/posts
// @access  Private (يحتاج توكن)
exports.createPost = async (req, res) => {
  try {
    const { content, image, visibility } = req.body;

    // إنشاء المنشور وربطه بالمستخدم الحالي (req.user._id)
    const newPost = await Post.create({
      user: req.user._id,
      content,
      image,
      visibility
    });

    // جلب بيانات المنشور مع بيانات صاحبه (بدل أن يرجع ID فقط، يرجع اسمه وصورته)
    const populatedPost = await Post.findById(newPost._id).populate(
      'user',
      'profile.firstName profile.lastName profile.headline profile.avatar'
    );

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    console.error('Create Post Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء المنشور' });
  }
};

// @desc    الحصول على جميع المنشورات (مع دعم الصفحات Pagination)
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    // إعدادات الصفحات (Pagination) كما طلبت في التوثيق
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // جلب المنشورات وترتيبها من الأحدث للأقدم
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'profile.firstName profile.lastName profile.headline profile.avatar')
      .populate('comments.user', 'profile.firstName profile.lastName profile.avatar'); // جلب بيانات أصحاب التعليقات أيضاً

    // جلب العدد الكلي للمنشورات لحساب عدد الصفحات
    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Posts Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب المنشورات' });
  }
};


// @desc    تسجيل إعجاب / إلغاء إعجاب بمنشور (Toggle Like)
// @route   POST /api/posts/:postId/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    // 1. البحث عن المنشور باستخدام الـ ID المرر في الرابط
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    }

    // 2. التحقق مما إذا كان المستخدم قد سجل إعجابه مسبقاً
    // (نبحث عن الـ ID الخاص بالمستخدم داخل مصفوفة الإعجابات)
    const index = post.likes.indexOf(req.user._id);
    let isLiked = false;

    if (index === -1) {
      // إذا لم نجده (-1)، نقوم بإضافته (إعجاب)
      post.likes.push(req.user._id);
      isLiked = true;
    } else {
      // إذا وجدناه، نقوم بحذفه (إلغاء الإعجاب)
      post.likes.splice(index, 1);
    }

    // 3. حفظ التعديلات في قاعدة البيانات
    await post.save();

    res.status(200).json({
      success: true,
      isLiked, // نرجع حالة الإعجاب الحالية للواجهة الأمامية لتغيير لون الزر
      likesCount: post.likes.length // نرجع العدد الإجمالي للإعجابات
    });
  } catch (error) {
    console.error('Like Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الإعجاب' });
  }
};

// @desc    إضافة تعليق على منشور
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'محتوى التعليق مطلوب' });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    }

    // تجهيز كائن التعليق الجديد
    const newComment = {
      user: req.user._id,
      content
    };

    // إضافة التعليق إلى مصفوفة التعليقات في المنشور (في النهاية أو البداية باستخدام unshift)
    post.comments.push(newComment);

    await post.save();

    res.status(201).json({
      success: true,
      message: 'تمت إضافة التعليق بنجاح',
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Comment Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة التعليق' });
  }
};