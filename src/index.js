const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// استدعاء دالة الاتصال بقاعدة البيانات
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // 👈 استدعاء مسار المستخدم الجديد  
const postRoutes = require('./routes/postRoutes'); // 👈 استدعاء مسار المنشورات   
// تحميل متغيرات البيئة من ملف .env
const companyRoutes = require('./routes/companyRoutes'); // 👈 استدعاء مسار الشركات
const adminRoutes = require('./routes/adminRoutes'); // تأكد من وجود هذا السطر
dotenv.config();

// الاتصال بقاعدة البيانات
connectDB();

// تهيئة تطبيق Express
const app = express();

// --- إعدادات الـ Middlewares الأساسية ---
app.use(helmet()); // لحماية الترويسات (Headers)
app.use(cors()); // للسماح للواجهة الأمامية بالاتصال
app.use(express.json()); // لكي يتمكن السيرفر من قراءة البيانات بصيغة JSON
app.use('/api/auth', authRoutes); 
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/companies', companyRoutes); // 👈 ربط المسار
app.use('/api/admin', adminRoutes);
// تسجيل الطلبات في موجه الأوامر أثناء التطوير
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// مسار تجريبي للتأكد من عمل السيرفر
app.get('/', (req, res) => {
  res.send('ProfitConnect API is running... 🚀');
});

// تحديد المنفذ من المتغيرات أو استخدام 3001 كاحتياطي
const PORT = process.env.PORT || 5000;

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});