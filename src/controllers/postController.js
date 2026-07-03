const Post = require('../models/Post');
const RScoreService = require('../services/rScoreService');
const { processDynamicScoring, evaluateContent } = require('../services/aiEvaluationService');
const { applyWarning } = require('../services/moderationService');
// @desc    إنشاء منشور جديد
// @route   POST /api/posts
// @access  Private (يحتاج توكن)
exports.createPost = async (req, res) => {
 try {
    const { content, image, visibility } = req.body;
    const newPost = await Post.create({ user: req.user._id, content, image, visibility });

    // 🤖 تقييم المنشور بالذكاء في الخلفية
    if (content) {
      setImmediate(async () => {
        try {
          const score = await evaluateContent(content);
          if (score === -1) {
            await Post.findByIdAndDelete(newPost._id);
            await applyWarning(req.user._id, content, 'محتوى منشور غير لائق');
          } else if (score > 0) {
            await RScoreService.applyScore(req.user._id, 'CREATE_POST', `جودة المنشور: ${score} نقاط`, score);
          }
        } catch (e) {
          console.error('[Post AI Error]:', e.message);
        }
      });
    }

    const populatedPost = await Post.findById(newPost._id).populate('user', 'profile.firstName profile.lastName profile.headline profile.avatar');
    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
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
      .populate({ path: 'comments.user', select: '_id profile.firstName profile.lastName profile.avatar' })
      .lean()

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
// @desc    تسجيل إعجاب / إلغاء إعجاب بمنشور (Toggle Like)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'المنشور غير موجود' });

    const index = post.likes.indexOf(req.user._id);
    let isLiked = false;

    if (index === -1) {
      post.likes.push(req.user._id);
      isLiked = true;
      
      // 🌟 3. مكافأة "صاحب المنشور" لأنه حصل على إعجاب جديد (التفاعل الإيجابي)
      // نتأكد أن المستخدم لا يعطي إعجاب لنفسه لتجنب الغش
      if (post.user.toString() !== req.user._id.toString()) {
        await RScoreService.applyScore(post.user.toString(), 'RECEIVE_LIKE', 'حصلت على إعجاب جديد على منشورك');
      }
      
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json({ success: true, isLiked, likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الإعجاب' });
  }
};
// @desc    إضافة تعليق على منشور
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    console.log('[AddComment Debug] req.body:', req.body);
    console.log('[AddComment Debug] req.params.postId:', req.params.postId);
    console.log('[AddComment Debug] content value:', content);

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
    const savedComment = post.comments[post.comments.length - 1];
    console.log('[AddComment Debug] Saved comment content:', savedComment?.content, '| Post ID:', post._id);


    // 🤖 تقييم التعليق بالذكاء في الخلفية
    const addedComment = post.comments[post.comments.length - 1];
    setImmediate(async () => {
      try {
        const score = await evaluateContent(content);
        if (score === -1) {
          await Post.findByIdAndUpdate(req.params.postId, {
            $pull: { comments: { _id: addedComment._id } }
          });
          await applyWarning(req.user._id, content, 'تعليق غير لائق');
        } else if (score > 0) {
          await RScoreService.applyScore(req.user._id, 'ADD_COMMENT', `جودة التعليق: ${score} نقاط`, score);
        }
      } catch (e) {
        console.error('[Comment AI Error]:', e.message);
      }
    });

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
// @desc    تعديل منشور
// @route   PUT /api/posts/:postId
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    }

    // 🔒 التأكد من أن المستخدم الحالي هو نفسه صاحب المنشور
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بتعديل هذا المنشور' });
    }

    // تحديث المنشور
    post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $set: { content: req.body.content, image: req.body.image, visibility: req.body.visibility } },
      { new: true, runValidators: true } // new: true لكي يرجع المنشور بعد التحديث
    ).populate('user', 'profile.firstName profile.lastName profile.avatar');

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تعديل المنشور' });
  }
};

// @desc    حذف منشور
// @route   DELETE /api/posts/:postId
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    }

    // 🔒 التأكد من أن المستخدم الحالي هو صاحب المنشور
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بحذف هذا المنشور' });
    }

    await post.deleteOne();

    res.status(200).json({ success: true, message: 'تم حذف المنشور بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف المنشور' });
  }
};

// @desc    حذف تعليق
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'المنشور غير موجود' });
    }

    // البحث عن التعليق داخل مصفوفة التعليقات
    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'التعليق غير موجود' });
    }

    // 🔒 التحقق من الصلاحيات: يُسمح بحذف التعليق إذا كان المستخدم هو (صاحب التعليق) أو (صاحب المنشور نفسه)
    if (
      comment.user.toString() !== req.user._id.toString() && 
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بحذف هذا التعليق' });
    }

    // إزالة التعليق من المصفوفة باستخدام دالة filter
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);

    await post.save();

    res.status(200).json({ 
      success: true, 
      message: 'تم حذف التعليق بنجاح', 
      commentsCount: post.comments.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف التعليق' });
  }
};