# Profit Connect API Documentation

> توثيق تلقائي مبني على **الكود الحالي** (Routes + Controllers + Middleware).

## 1) Base URLs
- `http://<host>:<port>`
- `GET /` (فحص تشغيل)

كل الـ endpoints في المشروع تُعرّف داخل `src/index.js` ضمن هذه الـ base paths:
- `/api/auth`
- `/api/user`
- `/api/posts`
- `/api/companies`
- `/api/admin`
- `/api/jobs`
- `/api/network`
- `/api/salaries`
- `/api/messages`

---

## 2) نمط الاستجابة (Response Envelope)
- نجاح:
```json
{ "success": true, "data": ... }
```
- نجاح مع رسالة:
```json
{ "success": true, "message": "..." }
```
- نجاح مع قائمة:
```json
{ "success": true, "count": <number>, "data": [ ... ] }
```
- نجاح مع Pagination:
```json
{
  "success": true,
  "count": <number>,
  "pagination": {
    "totalRecords": <number>,
    "currentPage": <number>,
    "totalPages": <number>
  },
  "data": [ ... ]
}
```
- فشل:
```json
{ "success": false, "message": "..." }
```

---

## 3) Authentication & Authorization
### JWT Bearer
- Middleware: `src/middleware/authMiddleware.js`
- معظم المسارات المحمية تستخدم:
  - Header: `Authorization: Bearer <token>`
- داخل middleware يتم وضع `req.user` من قاعدة البيانات.

### Admin
- middleware: `admin`
- شرط: `req.user.role === 'Admin'`
- تُستخدم عادة ضمن `/api/admin/*` أو عمليات مثل `admin` على الشركات.

---

## 4) Auth API (`/api/auth`)

### POST `/api/auth/signup`
- **Access:** Public
- **Body (JSON):**
  - `firstName`, `lastName`, `email`, `password`
  - `role`
  - `phoneNumber`, `industry`, `yearsOfExperience`, `skills`
  - `rScore` (موجود في الكود، وليس مضمونًا أنه مستخدم في الـ Schema)
- **Upload (اختياري):** `avatar` عبر multipart/form-data
- **Response (201):**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": { "id": "...", "email": "...", "role": "...", "profile": { ... } }
}
```

### POST `/api/auth/login`
- **Access:** Public
- **Body (JSON):**
  - `email`
  - `password`
- **Response (200):**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": { "id": "...", "email": "...", "role": "...", "profile": { ... } }
}
```

### GET `/api/auth/me`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "user": { ...formattedUser... } }
```

---

## 5) User API (`/api/user`)
> جميع المسارات هنا تستخدم `protect`.

### GET `/api/user/profile`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "data": { ...formattedUser... } }
```

### PUT `/api/user/profile`
- **Access:** Private
- **Body (JSON) اختياري حسب الحاجة:**
  - `firstName`, `lastName`, `bio`, `headline`, `location`
  - `phoneNumber`
  - `skills`, `industry`, `yearsOfExperience`
  - `socialLinks`: `linkedin`, `github`, `website`
- **Response (200):**
```json
{ "success": true, "message": "تم التحديث بنجاح", "data": { ...formattedUser... } }
```

### PUT `/api/user/profile/avatar`
- **Access:** Private
- **Type:** `multipart/form-data`
- **Field:** `avatar`
- **Response (200):**
```json
{
  "success": true,
  "message": "تم تحديث الصورة الشخصية بنجاح",
  "data": {
    "avatar": "avatar-url",
    "user": { ...formattedUser... }
  }
}
```

### DELETE `/api/user/profile`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "message": "تم حذف الحساب وبياناته بنجاح" }
```

### GET `/api/user/settings`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "data": { ...settings... } }
```

### PUT `/api/user/settings`
- **Access:** Private
- **Body:** فقط الحقول المسموحة في الكود:
  - `language`, `theme`, `emailNotifications`, `pushNotifications`
  - `profileVisibility`, `showEmail`, `showPhone`
- **Response (200):**
```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "data": { ...settings... }
}
```

### POST `/api/user/:userId/follow`
- **Access:** Private
- **Params:**
  - `userId`
- **Response (200):**
  - عند متابعة:
```json
{ "success": true, "following": true, "message": "تمت المتابعة بنجاح" }
```
  - عند إلغاء متابعة:
```json
{ "success": true, "following": false, "message": "تم إلغاء المتابعة" }
```

### GET `/api/user/:userId/followers`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...users... ] }
```

### GET `/api/user/:userId/following`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...users... ] }
```

### GET `/api/user/:userId`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "data": { ...formattedUser... } }
```

---

## 6) Posts API (`/api/posts`)
> Middleware: `router.use(protect)` على جميع المسارات.

### POST `/api/posts`
- **Access:** Private
- **Body (JSON):**
  - `content`
  - `image`
  - `visibility`
- **Response (201):**
```json
{ "success": true, "data": { ...postPopulated... } }
```

### GET `/api/posts`
- **Access:** Private
- **Query:**
  - `page` (default `1`)
  - `limit` (default `10`)
- **Response (200):**
```json
{
  "success": true,
  "data": [ ...posts... ],
  "pagination": { "page": 1, "limit": 10, "total": 100, "pages": 10 }
}
```

### PUT `/api/posts/:postId`
- **Access:** Private (صاحب المنشور فقط)
- **Params:** `postId`
- **Body (JSON):**
  - `content`, `image`, `visibility`
- **Response (200):**
```json
{ "success": true, "data": { ...updatedPost... } }
```

### DELETE `/api/posts/:postId`
- **Access:** Private (صاحب المنشور فقط)
- **Response (200):**
```json
{ "success": true, "message": "تم حذف المنشور بنجاح" }
```

### POST `/api/posts/:postId/like`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "isLiked": true, "likesCount": <number> }
```

### POST `/api/posts/:postId/comments`
- **Access:** Private
- **RateLimit:** `commentLimiter`
- **Body (JSON):**
  - `content`
- **Response (201):**
```json
{ "success": true, "message": "تمت إضافة التعليق بنجاح", "commentsCount": <number> }
```

### DELETE `/api/posts/:postId/comments/:commentId`
- **Access:** Private
- **Authorization:** مسموح إذا كان المستخدم:
  - صاحب التعليق **أو** صاحب المنشور
- **Response (200):**
```json
{ "success": true, "message": "تم حذف التعليق بنجاح", "commentsCount": <number> }
```

---

## 7) Companies API (`/api/companies`)
> `router.use(protect)` في `companyRoutes.js`.

### POST `/api/companies`
- **Access:** Private
- **Body (JSON):**
  - `name`, `description`, `industry`, `location`
  - `companySize`, `foundedYear`
  - `website`
  - `socialLinks`
  - `contactEmail`
- **Response (201):**
```json
{ "success": true, "data": { ...company... } }
```

### GET `/api/companies`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...companies... ] }
```

### GET `/api/companies/:id`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "data": { ...company... } }
```

### POST `/api/companies/:id/follow`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "isFollowing": true, "followersCount": <number> }
```

### POST `/api/companies/:id/admins`
- **Access:** Private (owner فقط)
- **Body (JSON):** `newAdminId`
- **Response (200):**
```json
{ "success": true, "message": "تمت إضافة المدير بنجاح", "adminsCount": <number> }
```

---

## 8) Admin Companies API (`/api/admin`)
> `adminRoutes.js`: `router.use(protect, admin)`.

### GET `/api/admin/companies/pending`
- **Access:** Private/Admin
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...companies... ] }
```

### PUT `/api/admin/companies/:id/status`
- **Access:** Private/Admin
- **Body (JSON):**
  - `status`: `Approved` أو `Rejected`
- **Response (200):**
```json
{ "success": true, "message": "تم تغيير حالة الشركة إلى ...", "data": { ...company... } }
```

---

## 9) Jobs API (`/api/jobs`)
> في `jobRoutes.js`:
- `GET /` public
- باقي المسارات محمية حسب تعريف الـ routes.

### GET `/api/jobs`
- **Access:** Public
- **Query اختياري:** `type`, `workPlace`, `workLevel`
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...jobs... ] }
```

### POST `/api/jobs`
- **Access:** Private
- **Body:** حقول `Job` + `companyId`
- **Response (201):**
```json
{ "success": true, "data": { ...job... } }
```

### POST `/api/jobs/:id/apply`
- **Access:** Private
- **Params:** `id`
- **Body (JSON):**
  - `resumeLink`
  - `coverLetter`
- **Response (201):**
```json
{
  "success": true,
  "message": "تم إرسال طلب التقديم بنجاح! حظاً موفقاً 🚀",
  "data": { ...application... }
}
```

### GET `/api/jobs/:id/applicants`
- **Access:** Private (Admin في شركة الوظيفة)
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...applications... ] }
```

### PUT `/api/jobs/applications/:applicationId/status`
- **Access:** Private (Admin في شركة الوظيفة)
- **Body (JSON):**
  - `status`: `Pending|Reviewed|Shortlisted|Rejected|Accepted`
- **Response (200):**
```json
{ "success": true, "message": "تم تحديث حالة الطلب إلى ... بنجاح", "data": { ... } }
```

### GET `/api/jobs/my-applications`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...applications... ] }
```

---

## 10) Network API (`/api/network`)
> `connectionRoutes.js`: `router.use(protect)`.

### GET `/api/network/connections`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...otherUsers... ] }
```

### POST `/api/network/connect/:userId`
- **Access:** Private
- **Response (201):**
```json
{ "success": true, "message": "تم إرسال طلب الاتصال بنجاح", "data": { ...connection... } }
```

### PUT `/api/network/accept/:requestId`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "message": "تم قبول طلب الاتصال، أنتما الآن متصلان!" }
```

### GET `/api/network/requests`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "count": <number>, "data": [ ...requests... ] }
```

### PUT `/api/network/reject/:requestId`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "message": "تم رفض طلب الاتصال" }
```

### DELETE `/api/network/remove/:userId`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "message": "تم إزالة جهة الاتصال بنجاح" }
```

---

## 11) Salaries API (`/api/salaries`)
> `salaryRoutes.js` كل المسارات Public.

### GET `/api/salaries`
- **Query:**
  - `title`, `country`, `category`
  - `experienceLevel` (مثل: Entry/Mid/Senior)
  - `page` default `1`
  - `limit` default `20`
- **Response (200):**
```json
{
  "success": true,
  "count": <number>,
  "pagination": {
    "totalRecords": <number>,
    "currentPage": <number>,
    "totalPages": <number>
  },
  "data": [ ...salaries... ]
}
```

### GET `/api/salaries/options`
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "titles": [ ... ],
    "countries": [ ... ],
    "categories": [ ... ],
    "experienceLevels": [ ... ]
  }
}
```

### GET `/api/salaries/stats`
- **Query اختياري:** `title`, `country`
- **Response (200):**
```json
{ "success": true, "data": [ { "_id": "...", "averageMin": 0, "averageMax": 0, "averageMedian": 0, "totalRecords": 0 } ] }
```

---

## 12) Messages API (`/api/messages`)
> `messageRoutes.js`: كل المسارات Private.

### POST `/api/messages/conversations`
- **Access:** Private
- **Body (JSON):** `recipientId`
- **Response (200):**
```json
{ "success": true, "data": { ...conversation... } }
```

### GET `/api/messages/conversations`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "data": [ ...conversations... ] }
```

### GET `/api/messages/conversations/:conversationId`
- **Access:** Private
- **Query:** `page` default `1`, `limit` default `30`
- **Response (200):**
```json
{ "success": true, "data": [ ...messages... ] }
```

### POST `/api/messages/conversations/:conversationId`
- **Access:** Private
- **Body (JSON):** `content`
- **Response (201):**
```json
{ "success": true, "data": { ...message... } }
```

### GET `/api/messages/unread`
- **Access:** Private
- **Response (200):**
```json
{ "success": true, "unreadCount": <number> }
```

