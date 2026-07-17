# وثيقة واجهة برمجة التطبيقات للإدارة (Admin API)

نظام إدارة شامل لمنصة Profit Connect. كل المسارات محمية ويجب أن يكون الطالب `Admin`.

- **القاعدة (Base URL):** `/api/admin`
- **الحماية:** `protect, admin` (يجب إرسال توكن Bearer صالح لحساب بدور `Admin`)
- **صيغة الاستجابة الموحّدة:**
```json
{ "success": true, "data": { ... }, "message": "..." }
```

---

## 0. المصادقة والصلاحيات

1. يُنشأ حساب الأدمن عبر تعيين دور مستخدم إلى `Admin` باستخدام:
   `PUT /api/admin/users/:id/role` بجسم `{ "role": "Admin" }`
   أو ببذر سجل مباشرة في قاعدة البيانات.
2. يسجّل الأدمن الدخول من `POST /api/auth/login` ويتلقى توكن JWT.
3. يُرسل التوكن في ترويسة كل طلب إداري:
   `Authorization: Bearer <token>`
4. أي محاولة من مستخدم غير `Admin` تُرجع `403 Forbidden`.

---

## 1. الإحصائيات العامة

### `GET /api/admin/stats`
ملخص أرقام المنصة للوحة التحكم.

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "users": 120,
    "companies": 15,
    "posts": 340,
    "pendingCompanies": 3,
    "usersByRole": [
      { "_id": "Employer", "count": 40 },
      { "_id": "JobSeeker", "count": 70 },
      { "_id": "Admin", "count": 2 },
      { "_id": "FreelanceClient", "count": 8 }
    ],
    "companiesByStatus": [
      { "_id": "Approved", "count": 10 },
      { "_id": "Pending", "count": 3 },
      { "_id": "Rejected", "count": 2 }
    ],
    "postsByAi": [
      { "_id": "clean", "count": 300 },
      { "_id": "suspected_ai", "count": 40 }
    ]
  }
}
```

---

## 2. إدارة المستخدمين

### `GET /api/admin/users`
قائمة المستخدمين مع فلترة وصفحات.

**الاستعلام (Query Params):**
| المفتاح | الوصف | مثال |
|---|---|---|
| `role` | فلترة بالدور | `Employer` |
| `status` | `active` أو `banned` | `banned` |
| `search` | بحث في الإيميل/اسم المستخدم/الاسم | `ahmad` |
| `page` | رقم الصفحة (افتراضي 1) | `2` |
| `limit` | عدد النتائج (افتراضي 10) | `20` |

**الاستجابة:**
```json
{
  "success": true,
  "count": 10,
  "total": 120,
  "page": 1,
  "pages": 12,
  "data": [ { "_id": "...", "email": "...", "role": "Employer", "status": "active", ... } ]
}
```

### `GET /api/admin/users/:id`
بيانات مستخدم كاملة + عدد شركاته ومنشوراته.
```json
{
  "success": true,
  "data": {
    "_id": "...", "email": "...", "role": "Employer", "profile": { ... },
    "employerProfile": { ... }, "settings": { ... }, "status": "active",
    "companiesCount": 2, "postsCount": 15
  }
}
```

### `PUT /api/admin/users/:id/role`
تغيير دور المستخدم.
**الجسم:**
```json
{ "role": "Employer" }
```
الأدوار المسموحة: `Employer`, `JobSeeker`, `Admin`, `FreelanceClient`

### `PUT /api/admin/users/:id/status`
تفعيل أو حظر المستخدم.
**الجسم:**
```json
{
  "status": "banned",
  "bannedUntil": "2026-12-31T00:00:00.000Z"   // اختياري؛ null = حظر دائم
}
```
- `status: "active"` → يُفعّل الحساب ويُلغى `bannedUntil`.
- `status: "banned"` → يُعطّل الحساب (`isActive: false`).

### `DELETE /api/admin/users/:id`
حذف المستخدم **وكل منشوراته** نهائياً. عملية لا يمكن التراجع عنها.

---

## 3. إدارة الشركات

### `GET /api/admin/companies`
كل الشركات مع فلترة.
**الاستعلام:** `status` (`Approved`/`Pending`/`Rejected`)، `search` (اسم الشركة).
تُرجع الشركات مع بيانات المالك مختصرة.

### `GET /api/admin/companies/pending`
الشركات التي تنتظر الموافقة فقط (`status: 'Pending'`).

### `GET /api/admin/companies/:id`
تفاصيل شركة كاملة: المالك، المدراء، المتابعون، والتقييمات (`ratings.user`).

### `PUT /api/admin/companies/:id/status`
اعتماد أو رفض الشركة + **إرسال إشعار تلقائي** لصاحب الشركة.
**الجسم:**
```json
{
  "status": "Approved",            // أو "Rejected"
  "rejectionReason": "بيانات غير مكتملة"   // مطلوب عند الرفض (اختياري)
}
```
- عند `Approved`: `isVerified: true` وتُفرغ `rejectionReason`.
- عند `Rejected`: `isVerified: false` ويُحفظ السبب.
- يُرسل إشعار من نوع `company_status` لصاحب الشركة (يظهر في `/api/projects/notifications`).

### `DELETE /api/admin/companies/:id`
حذف الشركة نهائياً.

---

## 4. الإشراف على المحتوى (المنشورات)

### `GET /api/admin/posts`
قائمة المنشورات للإشراف.
**الاستعلام:**
| المفتاح | الوصف |
|---|---|
| `minAi` | فلترة المنشورات التي احتمال الذكاء الاصطناعي فيها ≥ القيمة (مثال `50`) |
| `userId` | منشورات مستخدم محدد |
| `page`, `limit` | الصفحات |

تُرجع المنشورات مع بيانات الكاتب مختصرة و`aiProbability`.

### `DELETE /api/admin/posts/:id`
حذف منشور (إجراء إشرافي).

---

## 5. جدول المسارات السريع

| الطريقة | المسار | الوظيفة |
|---|---|---|
| GET | `/api/admin/stats` | الإحصائيات العامة |
| GET | `/api/admin/users` | قائمة المستخدمين |
| GET | `/api/admin/users/:id` | بيانات مستخدم كاملة |
| PUT | `/api/admin/users/:id/role` | تغيير الدور |
| PUT | `/api/admin/users/:id/status` | تفعيل/حظر |
| DELETE | `/api/admin/users/:id` | حذف مستخدم |
| GET | `/api/admin/companies` | كل الشركات |
| GET | `/api/admin/companies/pending` | الشركات المعلّقة |
| GET | `/api/admin/companies/:id` | تفاصيل شركة |
| PUT | `/api/admin/companies/:id/status` | اعتماد/رفض (+ إشعار) |
| DELETE | `/api/admin/companies/:id` | حذف شركة |
| GET | `/api/admin/posts` | المنشورات |
| DELETE | `/api/admin/posts/:id` | حذف منشور |

---

## 6. رموز الأخطاء الشائعة
- `400` — معرّف غير صالح أو قيمة حالة/دور غير مسموحة.
- `401` — توكن مفقود أو غير صالح.
- `403` — المستخدم ليس `Admin`.
- `404` — السجل المطلوب غير موجود.
- `500` — خطأ خادم داخلي.

---

## 7. ملاحظات للواجهة الأمامية (Frontend)
- ابنِ صفحة `/admin` محمية بشرط `user.role === 'Admin'`.
- استخدم `GET /stats` لبطاقات الأرقام أعلى اللوحة.
- استخدم الجداول مع الصفحات للـ `/users` و`/companies` و`/posts`.
- عند الاعتماد/الرفض أرسل `PUT /companies/:id/status` ثم حدّث قائمة المعلّقة.
- الإشعارات (`company_status`) تظهر لصاحب الشركة عبر `GET /api/projects/notifications` — ليست مخصصة للأدمن بل للمستخدم.
