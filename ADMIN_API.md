# وثيقة واجهة برمجة التطبيقات للإدارة (Admin API)

نظام إدارة شامل لمنصة Profit Connect. كل المسارات محمية ويجب أن يكون الطالب `Admin`.

- **القاعدة (Base URL):** `/api/admin`
- **الحماية:** `protect, admin` (يجب إرسال توكن Bearer صالح لحساب بدور `Admin`)

---

## 0. المصادقة والترويسات (Headers)

1. يُنشأ حساب الأدمن عبر تعيين دور مستخدم إلى `Admin`:
   `PUT /api/admin/users/:id/role` بجسم `{ "role": "Admin" }` أو بذرقة مباشرة في قاعدة البيانات.
2. يسجّل الأدمن الدخول من `POST /api/auth/login` ويتلقى توكن JWT (يُرسل في الاستجابة كـ `token`).
3. يُرسل التوكن في كل طلب إداري.

**الترويسات المطلوبة لكل طلب:**

| الترويسة | القيمة | إلزامية |
|---|---|---|
| `Authorization` | `Bearer <token>` | نعم — 401 غيره |
| `Content-Type` | `application/json` | لطلبات POST/PUT فقط |
| `Accept` | `application/json` | اختيارية |

**مثال كامل (PowerShell):**
```powershell
$headers = @{
  "Authorization" = "Bearer eyJhbGciOi..."
  "Content-Type"  = "application/json"
}
Invoke-RestMethod -Method Put -Uri "http://localhost:5000/api/admin/users/65f.../role" -Headers $headers -Body '{"role":"Employer"}' -ContentType "application/json"
```

**خطوط عامة:**
- أي محاولة من مستخدم غير `Admin` تُرجع `403 Forbidden`.
- توكن ناقص/منتهي → `401`.
- الطلب يتطلب وسطاء `protect, admin` — كل المسارات متحدة من الرأس حتى لو لم يُوثّق مسار.

---

## 1. هيكل الاستجابة الموحّد

**النجاح (GET عام):**
```json
{
  "success": true,
  "count": 15,
  "total": 300,
  "page": 1,
  "pages": 30,
  "data": [ ... ]
}
```

**النجاح (تفاصيل / عمليات كتابة):**
```json
{ "success": true, "data": { ... }, "message": "..." }
```

**الفشل:**
```json
{ "success": false, "message": "نص توضيحي" }
```

---

## 2. الإحصائيات العامة

### `GET /api/admin/stats`
ملخص أرقام المنصة للوحة التحكم — بلا Body ولا Query.

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

> `postsByAi`: تصنيف `suspected_ai` لمن لديه `aiProbability >= 50`، والباقي `clean`.

---

## 3. إدارة المستخدمين

### `GET /api/admin/users`
قائمة المستخدمين مع فلترة وصفحات (بدون `password`).

**الاستعلام (Query Params):**
| المفتاح | الوصف | مثال |
|---|---|---|
| `role` | فلترة بالدور | `Employer` |
| `status` | فلترة بالحالة | `banned` |
| `search` | بحث حُر في الإيميل/اسم المستخدم/الاسم الأول/الأخير | `ahmad` |
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
  "data": [
    {
      "_id": "65f...",
      "email": "john@example.com",
      "username": "john",
      "role": "Employer",
      "status": "active",
      "isActive": true,
      "bannedUntil": null,
      "profile": { "firstName": "John", "lastName": "Doe", "bio": "...", "title": "...", "industry": "تطوير برمجيات", "skills": [], "avatar": "..." },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/admin/users/:id`
بيانات مستخدم كاملة + عدد شركاته ومنشوراته (بدون `password`).

**مسارات الأخطاء:** `400` معرّف غير صالح (ليس ObjectId بقياس 24 خانة)، `404` غير موجود.

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "...",
    "role": "Employer",
    "status": "active",
    "profile": { ... },
    "employerProfile": { ... },
    "freelanceProfile": { ... },
    "settings": { ... },
    "wallet": { ... },
    "companiesCount": 2,
    "postsCount": 15
  }
}
```

### `PUT /api/admin/users/:id/role`
تغيير دور المستخدم.

**Body:**
```json
{ "role": "Employer" }
```

الأدوار المسموحة: `Employer`, `JobSeeker`, `Admin`, `FreelanceClient`

**الاستجابة:**
```json
{ "success": true, "message": "تم تعيين دور المستخدم إلى Employer", "data": { "id": "65f...", "role": "Employer" } }
```

### `PUT /api/admin/users/:id/status`
تفعيل أو حظر المستخدم.

**Body:**
```json
{
  "status": "banned",
  "bannedUntil": "2026-12-31T00:00:00.000Z"
}
```

- `status: "active"` → `isActive: true` ويُلغى `bannedUntil`.
- `status: "banned"` → `isActive: false`؛ يحفظ `bannedUntil` إن وُرد، وإلا `null` (حظر دائم).

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تعيين حالة المستخدم إلى banned",
  "data": { "id": "65f...", "status": "banned", "isActive": false, "bannedUntil": "2026-12-31T00:00:00.000Z" }
}
```

### `DELETE /api/admin/users/:id`
حذف المستخدم **وكل منشوراته** نهائيًا (لا تراجع). بلا Body.

**الاستجابة:**
```json
{ "success": true, "message": "تم حذف المستخدم ومنشوراته" }
```

---

## 4. إدارة الشركات

### `GET /api/admin/companies`
كل الشركات مع فلترة (بلا ترقيم صفحات).

**الاستعلام:** `status` (`Approved`/`Pending`/`Rejected`)، `search` (تطابق في اسم الشركة، حساسية أحرف منخفضة).

**الاستجابة:** `{ success, count, data: [Company...] }` مع `owner` مملوء (`profile.firstName`, `profile.lastName`, `email`, `username`).

### `GET /api/admin/companies/pending`
الشركات التي تنتظر الموافقة فقط (`status: 'Pending'`) — بلا Body.

**الاستجابة:** `{ success, count, data }` مع `owner` مملوء (`firstName`, `lastName`, `email`).

### `GET /api/admin/companies/:id`
تفاصيل شركة كاملة للإدارة.

**الحشوات (Populates):** `owner`, `admins`, `followers`, `ratings.user` (كلها بالمعلومات المختصرة: firstName/lastName/email/username).

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "شركة التقنية",
    "description": "...",
    "industry": "...",
    "website": "...",
    "logo": "...",
    "status": "Approved",
    "isVerified": true,
    "rejectionReason": "",
    "owner": { "_id": "...", "email": "...", "profile": {...}, "username": "..." },
    "admins": [ { ... } ],
    "followers": [ { ... } ],
    "ratings": [ { "user": { ... }, "value": 5, "comment": "..." } ],
    "createdAt": "..."
  }
}
```

### `PUT /api/admin/companies/:id/status`
اعتماد أو رفض الشركة + **إشعار تلقائي** لصاحب الشركة (نوع `company_status` يظهر في `GET /api/projects/notifications`).

**Body:**
```json
{
  "status": "Approved",
  "rejectionReason": "بيانات غير مكتملة"
}
```

- `status: "Approved"` → `isVerified: true` وتُفرغ `rejectionReason`.
- `status: "Rejected"` → `isVerified: false` ويُحفظ السبب (اختياري، يُرفق في نص الإشعار).

**الاستجابة:**
```json
{ "success": true, "message": "تم تغيير حالة الشركة إلى Approved", "data": { ...Company... } }
```

### `DELETE /api/admin/companies/:id`
حذف الشركة نهائيًا. بلا Body.

**الاستجابة:** `{ "success": true, "message": "تم حذف الشركة" }`

---

## 5. الإشراف على المحتوى (المنشورات)

### `GET /api/admin/posts`
قائمة المنشورات للإشراف مع صفحات.

**الاستعلام:**
| المفتاح | الوصف |
|---|---|
| `minAi` | منشورات `aiProbability >= value` (مثال `50`) |
| `userId` | منشورات مستخدم محدد |
| `page`, `limit` | الصفحات (افتراضي 1 و10) |

تُرجع المنشورات مع بيانات الكاتب المختصرة (`profile.firstName`, `profile.lastName`, `email`, `username`) والحقل `aiProbability`.

**الاستجابة:**
```json
{
  "success": true,
  "count": 10,
  "total": 340,
  "page": 1,
  "pages": 34,
  "data": [
    {
      "_id": "...",
      "content": "نص المنشور",
      "media": [],
      "user": { "_id": "...", "email": "...", "username": "...", "profile": { "firstName": "..", "lastName": ".." } },
      "aiProbability": 72,
      "aiDetails": { ... },
      "likesCount": 5,
      "commentsCount": 2,
      "sharesCount": 0,
      "createdAt": "..."
    }
  ]
}
```

### `DELETE /api/admin/posts/:id`
حذف منشور (إجراء إشرافي). بلا Body.

**الاستجابة:** `{ "success": true, "message": "تم حذف المنشور" }`

---

## 6. النظام المالي (المحافظ والإسكرو والسحوبات)

### `GET /api/admin/finance/overview`
نظرة عامة مالية للوحة — بلا Body ولا Query.

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "platformHolding": 12500,
    "pendingWithdrawals": 850,
    "pendingWithdrawalsCount": 3,
    "totalFees": 1500,
    "totalReleased": 12000,
    "totalRefunded": 600,
    "totalWithdrawn": 3000,
    "platformFeePercent": 10
  }
}
```

| الحقل | المعنى |
|---|---|
| `platformHolding` | أموال محجوزة لدى المنصة (Escrow) بدفعات `held` |
| `pendingWithdrawals` + `_Count` | إجمالي/عدد طلبات السحب المعلّقة |
| `totalFees` | إيراد المنصة من العمولات على الدفعات المحرّرة |
| `totalReleased` | صافي ما تم تحريره للمستخدمين (`netAmount`) |
| `totalRefunded` | إجمالي الاسترجاعات |
| `totalWithdrawn` | إجمالي السحوبات المنفّذة |
| `platformFeePercent` | نسبة العمولة الحالية (الافتراضي 10) |

### `GET /api/admin/finance/withdrawals`
قائمة طلبات السحب مع فلترة وصفحات.

**الاستعلام:** `status` (`pending`/`processed`/`rejected`/`cancelled`)، `page` (1)، `limit` (20).

**الاستجابة** (`user` مملوء): `{ success, count, total, data }`
```json
{
  "_id": "65f...",
  "user": { "_id": "...", "email": "...", "username": "...", "profile": { "firstName": "..", "lastName": ".." } },
  "amount": 250,
  "currency": "USD",
  "method": "bank_transfer",
  "accountDetails": { "bankName": "الأهلي", "iban": "SA...", "accountNumber": "...", "holderName": "..." },
  "status": "pending",
  "adminNote": "",
  "processedAt": null,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

- `method` ∈ `bank_transfer` | `cash` | `other`
- `status` ∈ `pending` | `processed` | `rejected` | `cancelled`

### `PUT /api/admin/finance/withdrawals/:id`
موافقة أو رفض طلب سحب **المعلّق فقط**.

**Body:**
```json
{
  "action": "approve",
  "note": "تم التحويل عبر البنك"
}
```

- `action` ∈ `approve` | `reject` (إلزامي، غيره → `400`).
- `note` اختياري — يُحفظ في `adminNote` ويُرفق بنص إشعار الرفض.

**التأثيرات الجانبية (Wallet + معاملة + إشعار):**
| action | wallet | MoneyTransaction `type` | إشعار |
|---|---|---|---|
| `approve` | `holding − amount`، `totalWithdrawn + amount` | `withdraw_processed` | `withdrawal_approved` |
| `reject` | `holding − amount`، `balance + amount` | `withdraw_refund` | `withdrawal_rejected` (نصه يضم السبب) |

إشعار `withdrawal_rejected` يحمل إضافات `{ withdrawalId, amount }`.

**الاستجابة:**
```json
{
  "success": true,
  "message": "تمت الموافقة على طلب السحب",
  "data": { ...Withdrawal Packet بعد التحديث... }
}
```

> إن لم يوجد الطلب أو لم يكن `pending` → `400` "الطلب غير موجود أو تمت معالجته من قبل".

### `GET /api/admin/finance/payments`
قائمة الدفعات (إسكرو) مع فلترة وصفحات.

**الاستعلام:** `status` (`held`/`released`/`refunded`/`cancelled`)، `page` (1)، `limit` (20).

**الاستجابة** — حشوات `project (title, status)`، `payer`، `payee`:
```json
{
  "success": true, "count": 20, "total": 200,
  "data": [
    {
      "_id": "65f...",
      "project": { "_id": "...", "title": "بناء موقع", "status": "in_progress" },
      "payer": { "_id": "...", "email": "...", "profile": { "firstName": "..", "lastName": ".." } },
      "payee": { "_id": "...", "email": "...", "profile": { "firstName": "..", "lastName": ".." } },
      "proposal": "65f...",
      "amount": 1000,
      "currency": "USD",
      "method": "PayPal",
      "fee": 100,
      "netAmount": 900,
      "status": "held",
      "note": "",
      "releasedAt": null,
      "refundedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

- `method` ∈ `PayPal` | `Visa` | `Mastercard` | `American Express` | `Apple Pay` | `ShamCash`
- `status` ∈ `held` | `released` | `refunded` | `cancelled`
- `fee`/`netAmount` تُحتسب لحظة التحرير: `fee = amount × platformFeePercent ÷ 100`، `netAmount = amount − fee`.

### `POST /api/admin/finance/payments/:id/release`
تحرير دفعة يدويًا من لوحة الأدمن (نقل المبلغ الصافي لمحفظة المستفيد).

- **Body:** بلا جسم (أو `{}` فارغ).
- **في حال الخطأ:** `400` برسالة السبب (مثل "الدفعة غير محجوزة" من خدمة التحرير).
- **إشعارات:** `payment_released` بترويسة `{ paymentId, projectId, amount, method }` لكل من `payee` (المبلغ في محفظتك) و`payer` (تحرير من الحساب الضامن).

**الاستجابة:**
```json
{ "success": true, "message": "تم تحرير الدفعة", "data": { ...نتيجة تحرير الدفعة... } }
```

### `POST /api/admin/finance/payments/:id/refund`
استرجاع دفعة (إلغاء/نزاع) — تُعاد لمحفظة الدافع.

- **Body:** بلا جسم.
- **إشعارات:** `payment_refunded` للدافع (المبلغ أُعيد لمحفظتك) وللـ`payee` (استرجاع من الحساب الضامن).

**الاستجابة:**
```json
{ "success": true, "message": "تم استرجاع الدفعة لمحفظة الدافع", "data": { ... } }
```

### `PUT /api/admin/finance/settings`
تحديث نسبة عمولة المنصة (تُطبق على الدفعات المستقبلية).

**Body:**
```json
{ "platformFeePercent": 7 }
```

- التحقق: `0 <= value <= 100` وإلا `400` "نسبة العمولة يجب أن تكون بين 0 و 100".
- يُخزَّن كمستند `Setting` بمفتاح `platformFeePercent` (upsert).

**الاستجابة:**
```json
{ "success": true, "message": "تم تحديث إعدادات المنصة", "data": { "platformFeePercent": 7 } }
```

---

## 7. جدول المسارات السريع (الكامل)

| الطريقة | المسار | الوظيفة | Body |
|---|---|---|---|
| GET | `/api/admin/stats` | الإحصائيات العامة | — |
| GET | `/api/admin/users` | قائمة المستخدمين | — |
| GET | `/api/admin/users/:id` | بيانات مستخدم كاملة | — |
| PUT | `/api/admin/users/:id/role` | تغيير الدور | `{ "role" }` |
| PUT | `/api/admin/users/:id/status` | تفعيل/حظر | `{ "status", "bannedUntil"? }` |
| DELETE | `/api/admin/users/:id` | حذف مستخدم + منشوراته | — |
| GET | `/api/admin/companies` | كل الشركات | — |
| GET | `/api/admin/companies/pending` | الشركات المعلّقة | — |
| GET | `/api/admin/companies/:id` | تفاصيل شركة | — |
| PUT | `/api/admin/companies/:id/status` | اعتماد/رفض (+ إشعار) | `{ "status", "rejectionReason"? }` |
| DELETE | `/api/admin/companies/:id` | حذف شركة | — |
| GET | `/api/admin/posts` | المنشورات للإشراف | — |
| DELETE | `/api/admin/posts/:id` | حذف منشور | — |
| GET | `/api/admin/finance/overview` | النظرة المالية العامة | — |
| GET | `/api/admin/finance/withdrawals` | طلبات السحب | — |
| PUT | `/api/admin/finance/withdrawals/:id` | موافقة/رفض سحب | `{ "action", "note"? }` |
| GET | `/api/admin/finance/payments` | الدفعات (إسكرو) | — |
| POST | `/api/admin/finance/payments/:id/release` | تحرير دفعة يدويًا | — |
| POST | `/api/admin/finance/payments/:id/refund` | استرجاع دفعة | — |
| PUT | `/api/admin/finance/settings` | نسبة عمولة المنصة | `{ "platformFeePercent" }` |

---

## 8. رموز الأخطاء الشائعة

- `400` — معرّف غير صالح / قيمة حالة أو دور غير مسموحة / طلب سحب معالَج مسبقًا / نسبة عمولة خارج النطاق.
- `401` — توكن مفقود أو غير صالح.
- `403` — المستخدم ليس `Admin`.
- `404` — السجل المطلوب غير موجود.
- `500` — خطأ خادم داخلي (مع `message` عام).

---

## 9. ملاحظات للواجهة الأمامية (Frontend)

- ابنِ صفحة `/admin` محمية بشرط `user.role === 'Admin'`؛ مخزن التوكن في `localStorage` ويُرفق عبر Interceptor.
- استخدم `GET /finance/overview` + `GET /stats` لبطاقات الأرقام أعلى اللوحة (مؤشرات مالية + مستخدمين وشركات ومنشورات).
- استخدم الجداول مع الصفحات في `/users` و`/admin/finance/withdrawals` و`/payments` و`/posts`.
- عند الاعتماد/الرفض أرسل `PUT /companies/:id/status` ثم حدّث قائمة المعلّقة.
- مراجعة السحب: زرّا قبول/رفض → `PUT /finance/withdrawals/:id` بجسم `{ action }`؛ اعرض `accountDetails` وتنبّه عند تغيير محفظة المستخدم.
- أجندة الدفعات: أزرار "تحرير" و"استرجاع" على الدفعات `held` فقط، مع تأكيد قبل التنفيذ، وتحديث الـoverview بعده.
- إشعارات المستخدمين عموماً (`withdrawal_*`, `payment_*`, `company_status`) ليست موجهة للأدمن بل لأصحابها؛ اقرأها في تطبيق المستخدم العادي (`/api/projects/notifications`).
- جميع العمليات الكتابية تعيد الاستجابة فورًا؛ لا توجد عمليات غير متزامنة تحتاج تتبع حالة في هذه المجموعة.