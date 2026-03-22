const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ['Entry', 'Mid', 'Senior'], // تحديد القيم المسموحة فقط
    trim: true
  },
  minSalaryUSD: {
    type: Number,
    required: true
  },
  maxSalaryUSD: {
    type: Number,
    required: true
  },
  medianSalaryUSD: {
    type: Number,
    required: true
  }
}, {
  timestamps: true // يقوم بإضافة حقلي createdAt و updatedAt تلقائياً
});

// إضافة الفهارس (Indexes) لتسريع عمليات البحث والفلترة في قاعدة البيانات
salarySchema.index({ title: 1 });
salarySchema.index({ country: 1 });
salarySchema.index({ category: 1 });
// فهرس مركب (Compound Index) لأن المستخدم غالباً سيبحث عن المسمى الوظيفي داخل دولة معينة
salarySchema.index({ title: 1, country: 1 }); 

const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;