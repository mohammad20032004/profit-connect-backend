//استدعاء مكتبة المونغو ديبي 
const mongoose = require('mongoose');


//تابع للاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    // نستخدم المتغير DATABASE_URL من ملف .env
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // إيقاف الخادم في حال فشل الاتصال بقاعدة البيانات
    process.exit(1);
  }
};

module.exports = connectDB;