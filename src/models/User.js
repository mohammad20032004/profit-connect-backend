const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صحيح']
    },
    password: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة'],
      minlength: 6,
      select: false // لعدم إرجاع كلمة المرور عند جلب بيانات المستخدم
    },
    username: {
      type: String,
      trim: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['Student', 'Professional', 'Admin', 'Client'],
      default: 'Student',
      required: [true, 'يرجى تحديد نوع الحساب (طالب أو محترف)']
    },
    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      fullname: String,
      phoneNumber: String,
      headline: String,
      bio: String,
      avatar: {
        type: String,
        default: 'default-avatar.png'
      },
      location: String,
      socialLinks: {
        linkedin: { type: String, trim: true, default: '' },
        github: { type: String, trim: true, default: '' },
        website: { type: String, trim: true, default: '' }
      },
      followers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      following: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      followersCount: {
        type: Number,
        default: 0
      },
      followingCount: {
        type: Number,
        default: 0
      },
      postsCount: {
        type: Number,
        default: 0
      },
      rScore:{
        type: Number,
        default: 0
      }
    },
    professional: {
      industry: String,
      yearsOfExperience: Number,
      skills: [String]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    // 🌟 تم نقل حقل الحالة إلى المكان الصحيح داخل الحقول 🌟
    status: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active'
    },
    // 🌟 تم نقل مصفوفة التنبيهات الذكية إلى المكان الصحيح 🌟
    settings: {
      language:          { type: String, enum: ['ar', 'en'], default: 'en' },
      theme:             { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailNotifications:{ type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
      showEmail:         { type: Boolean, default: false },
      showPhone:         { type: Boolean, default: false },
      animationEnabled:  { type: Boolean, default: true },
    },
    bannedUntil: { type: Date, default: null },
    warnings: [{
      content: { type: String, required: true },
      reason: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }],
    notifications: [{
      type: { type: String, enum: ['proposal_accepted', 'proposal_rejected'], required: true },
      projectName: { type: String, required: true },
      clientName: { type: String, required: true },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      proposalStatus: { type: String, enum: ['accepted', 'rejected'], required: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  }, // 👈 هنا تم إغلاق كائن الحقول بالكامل وبشكل صحيح
  { timestamps: true } // 👈 هنا المعامل الثاني (الإعدادات)
);

// تجهيز البيانات وتشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function () {
  // 1. تحديث الاسم الكامل واسم المستخدم دائماً (إذا توفرت البيانات)
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    this.profile.fullname = `${this.profile.firstName} ${this.profile.lastName}`;
  }

  if (!this.username && this.profile && this.profile.firstName) {
    this.username = `${this.profile.firstName.toLowerCase()}_${Date.now()}`;
  }

  // 2. إذا لم يتم تعديل كلمة المرور، تخطى التشفير واخرج
  if (!this.isModified('password')) {
    return;
  }

  // 3. تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// دالة لمقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);