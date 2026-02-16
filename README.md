# ProfitConectBackEnd

بنية مشروع باك-إند بسيطة مبنية على Node.js + Express.

بنية المجلدات الأساسية:

- src/
  - controllers/
  - routes/
  - models/
  - services/
  - config/
  - middleware/
  - utils/
- public/
- tests/
- scripts/
- logs/

ملفات مهمة:
- .env.sample — نموذج متغيرات البيئة
- .gitignore — استثناء الملفات
- src/index.js — نقطة الدخول
- src/app.js — تهيئة التطبيق ورفع السيرفر

تشغيل محلي سريع:

```bash
cp .env.sample .env
npm install
node src/index.js
```
