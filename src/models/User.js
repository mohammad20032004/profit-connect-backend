const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
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
      unique: true,
    },
    role: {
      type: String,
      enum: ['Student', 'Professional'],
      default: 'Student', // جعلنا القيمة الافتراضية محترف، ويمكنك تغييرها
      required: [true, 'يرجى تحديد نوع الحساب (طالب أو محترف)']
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      fullname: String,
      phoneNumber: String,
      headline: String,
      bio: String,
      avatar: String,
      location: String
    },
    professional: {
      industry: String,
      yearsOfExperience: Number,
      skills: [String]
    }
  },
  { timestamps: true }
);

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function (next) {
  // إذا لم يتم تعديل كلمة المرور، تخطى التشفير
  if (!this.isModified('password')) {
   return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // إنشاء fullname تلقائياً و username مبدئي
  this.profile.fullname = `${this.profile.firstName} ${this.profile.lastName}`;
  if (!this.username) {
    this.username = `${this.profile.firstName.toLowerCase()}_${Date.now()}`;
  }
  return;
});

// دالة لمقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);