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
      enum: ['Student', 'Professional', 'Admin'],
      default: 'Student', // جعلنا القيمة الافتراضية محترف، ويمكنك تغييرها
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
        default: 'default-avatar.png' // صورة افتراضية
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
          ref: 'User' // ربط هذا الحقل بنموذج المستخدم نفسه
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
    },
    professional: {
      industry: String,
      yearsOfExperience: Number,
      skills: [String]
    },

    isActive: {
      type: Boolean,
      default: true // الحساب نشط افتراضياً
    },
    isVerified: {
      type: Boolean,
      default: true
    },
  },
  { timestamps: true }
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

  // 2. إذا لم يتم تعديل كلمة المرور (مثلاً المستخدم يعدل صورته فقط)، تخطى التشفير واخرج
  if (!this.isModified('password')) {
    return;
  }

  // 3. تشفير كلمة المرور (يعمل فقط عند إنشاء حساب جديد أو تغيير الباسورد)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});// دالة لمقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);