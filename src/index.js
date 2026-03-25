const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// استدعاء دالة الاتصال بقاعدة البيانات
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // 👈 استدعاء مسار المستخدم الجديد  
const postRoutes = require('./routes/postRoutes'); // 👈 استدعاء مسار المنشورات   
// تحميل متغيرات البيئة من ملف .env
const companyRoutes = require('./routes/companyRoutes'); // 👈 استدعاء مسار الشركات
const adminRoutes = require('./routes/adminRoutes'); // تأكد من وجود هذا السطر
const jobRoutes = require('./routes/jobRoutes');
const network = require('./routes/connectionRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
dotenv.config();

// الاتصال بقاعدة البيانات
connectDB();

// تهيئة تطبيق Express
const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
};

// --- إعدادات الـ Middlewares الأساسية ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
); // لحماية الترويسات (Headers) مع السماح بعرض الصور من الواجهة
app.use(cors(corsOptions)); // للسماح للواجهة الأمامية بالاتصال
app.use(express.json()); // لكي يتمكن السيرفر من قراءة البيانات بصيغة JSON
app.use('/uploads', cors(corsOptions), express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes); 
app.use('/api/user', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/companies', companyRoutes); // 👈 ربط المسار
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/network', network);
app.use('/api/salaries', salaryRoutes);

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
