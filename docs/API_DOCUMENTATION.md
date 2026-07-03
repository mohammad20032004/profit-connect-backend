# ProfitConnect API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Auth Method:** Bearer Token (JWT)  
> **Content-Type:** `application/json` (unless file upload)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [User Follow System](#3-user-follow-system)
4. [Posts](#4-posts)
5. [Companies](#5-companies)
6. [Jobs](#6-jobs)
7. [Salaries](#7-salaries)
8. [Messaging](#8-messaging)
9. [Admin](#9-admin)
10. [Database Schemas](#10-database-schemas)

---

## 1. Authentication

### 1.1 POST /auth/signup — إنشاء حساب جديد

**Access:** Public

**Request Body (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | String | ✅ | الاسم الأول |
| lastName | String | ✅ | اسم العائلة |
| email | String | ✅ | البريد الإلكتروني (فريد) |
| password | String | ✅ | كلمة المرور (6 أحرف كحد أدنى) |
| role | String | ✅ | `Student` أو `Professional` أو `Admin` |
| phoneNumber | String | ❌ | رقم الهاتف |
| industry | String | ❌ | المجال المهني |
| yearsOfExperience | Number | ❌ | سنوات الخبرة |
| skills | String[] | ❌ | المهارات (مصفوفة نصية) |
| avatar | File | ❌ | الصورة الشخصية (jpg/png/webp, max 5MB) |

**Response (201 Created):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "667a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "username": "ahmed_1234567890",
    "role": "Student",
    "profile": {
      "firstName": "أحمد",
      "lastName": "علي",
      "fullname": "أحمد علي",
      "phoneNumber": "+966501234567",
      "headline": null,
      "bio": null,
      "avatar": "http://localhost:5000/uploads/avatars/avatar-xxx.jpg",
      "location": null,
      "socialLinks": { "linkedin": "", "github": "", "website": "" },
      "followers": [],
      "following": [],
      "followersCount": 0,
      "followingCount": 0,
      "postsCount": 0,
      "rScore": 0
    },
    "professional": {
      "industry": "تقنية معلومات",
      "yearsOfExperience": 3,
      "skills": ["JavaScript", "Node.js"]
    },
    "isActive": true,
    "isVerified": true
  }
}
```

**Error Responses:**
- `400` — البريد الإلكتروني مسجل بالفعل
- `500` — خطأ في الخادم

---

### 1.2 POST /auth/login — تسجيل الدخول

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "667a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "username": "ahmed_1234567890",
    "role": "Student",
    "profile": { "...": "..." },
    "professional": { "...": "..." }
  }
}
```

**Error Responses:**
- `400` — يرجى إدخال البريد الإلكتروني وكلمة المرور
- `401` — بيانات الدخول غير صحيحة
- `500` — خطأ في الخادم

---

### 1.3 GET /auth/me — جلب المستخدم الحالي

**Access:** Private (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "667a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "username": "ahmed_1234567890",
    "role": "Student",
    "profile": { "...": "..." },
    "professional": { "...": "..." },
    "posts": [
      {
        "_id": "...",
        "content": "...",
        "image": null,
        "visibility": "public",
        "likes": [],
        "comments": [],
        "createdAt": "2025-06-28T10:00:00.000Z",
        "updatedAt": "2025-06-28T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `401` — غير مصرح لك بالوصول

---

## 2. User Profile

### 2.1 GET /user/profile — جلب الملف الشخصي

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "667a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "username": "ahmed_1234567890",
    "role": "Student",
    "profile": {
      "firstName": "أحمد",
      "lastName": "علي",
      "fullname": "أحمد علي",
      "phoneNumber": "+966501234567",
      "headline": "مطور Full-Stack",
      "bio": "مطور ويب بخبرة 5 سنوات",
      "avatar": "http://localhost:5000/uploads/avatars/avatar-xxx.jpg",
      "location": "الرياض، السعودية",
      "socialLinks": {
        "linkedin": "https://linkedin.com/in/...",
        "github": "https://github.com/...",
        "website": "https://example.com"
      },
      "followers": ["userId1", "userId2"],
      "following": ["userId3"],
      "followersCount": 2,
      "followingCount": 1,
      "postsCount": 5,
      "rScore": 65
    },
    "professional": {
      "industry": "تقنية معلومات",
      "yearsOfExperience": 5,
      "skills": ["JavaScript", "Node.js", "React"]
    },
    "posts": [ "...posts..." ]
  }
}
```

---

### 2.2 PUT /user/profile — تحديث الملف الشخصي

**Access:** Private

**Request Body:**

```json
{
  "firstName": "أحمد",
  "lastName": "علي",
  "bio": "مطور ويب بخبرة 5 سنوات",
  "headline": "مطور Full-Stack",
  "location": "الرياض، السعودية",
  "phoneNumber": "+966501234567",
  "skills": ["JavaScript", "Node.js", "React"],
  "industry": "تقنية معلومات",
  "yearsOfExperience": 5,
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "website": "https://example.com"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم التحديث بنجاح",
  "data": {
    "id": "...",
    "email": "...",
    "profile": { "...": "..." },
    "professional": { "...": "..." }
  }
}
```

---

### 2.3 PUT /user/profile/avatar — تحديث الصورة الشخصية

**Access:** Private

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| avatar | File | ✅ | صورة شخصية (jpg/png/webp, max 5MB) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم تحديث الصورة الشخصية بنجاح",
  "data": {
    "avatar": "http://localhost:5000/uploads/avatars/avatar-xxx.jpg",
    "user": { "...user data..." }
  }
}
```

---

### 2.4 DELETE /user/profile — حذف الحساب

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم حذف الحساب وبياناته بنجاح"
}
```

---

### 2.5 GET /user/settings — جلب الإعدادات

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "language": "en",
    "theme": "system",
    "emailNotifications": true,
    "pushNotifications": true,
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false
  }
}
```

---

### 2.6 PUT /user/settings — تحديث الإعدادات

**Access:** Private

**Request Body:**

```json
{
  "language": "ar",
  "theme": "dark",
  "emailNotifications": true,
  "pushNotifications": false,
  "profileVisibility": "connections",
  "showEmail": false,
  "showPhone": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "data": {
    "language": "ar",
    "theme": "dark",
    "emailNotifications": true,
    "pushNotifications": false,
    "profileVisibility": "connections",
    "showEmail": false,
    "showPhone": true
  }
}
```

---

### 2.7 GET /user/:userId — جلب مستخدم بواسطة ID

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "667a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "username": "ahmed_1234567890",
    "role": "Student",
    "profile": { "...": "..." },
    "professional": { "...": "..." }
  }
}
```

**Error:** `404` — المستخدم غير موجود

---

## 3. User Follow System

### 3.1 POST /user/:userId/follow — متابعة / إلغاء متابعة (Toggle)

**Access:** Private

| Parameter | Description |
|-----------|-------------|
| userId | ID المستخدم المستهدف |

**Response (200 OK) — متابعة:**

```json
{
  "success": true,
  "following": true,
  "message": "تمت المتابعة بنجاح"
}
```

**Response (200 OK) — إلغاء متابعة:**

```json
{
  "success": true,
  "following": false,
  "message": "تم إلغاء المتابعة"
}
```

**Error:** `400` — لا يمكنك متابعة نفسك

---

### 3.2 GET /user/:userId/followers — جلب المتابعين

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "userId1",
      "profile": {
        "firstName": "خالد",
        "lastName": "محمد",
        "avatar": "http://...",
        "headline": "مطور برمجيات"
      }
    }
  ]
}
```

---

### 3.3 GET /user/:userId/following — جلب المتابَعين

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "userId3",
      "profile": {
        "firstName": "سارة",
        "lastName": "أحمد",
        "avatar": "http://...",
        "headline": "مهندسة برمجيات"
      }
    }
  ]
}
```

---

### 3.4 POST /users/:userId/follow — متابعة مستخدم

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تمت متابعة المستخدم بنجاح"
}
```

**Error:** `400` — أنت تتابع هذا المستخدم بالفعل

---

### 3.5 DELETE /users/:userId/follow — إلغاء متابعة مستخدم

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم إلغاء متابعة المستخدم بنجاح"
}
```

---

## 4. Posts

### 4.1 POST /posts — إنشاء منشور جديد

**Access:** Private

**Request Body:**

```json
{
  "content": "نص المنشور",
  "image": "https://example.com/image.jpg",
  "visibility": "public"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | String | ✅ | محتوى المنشور |
| image | String | ❌ | رابط الصورة |
| visibility | String | ❌ | `public`, `private`, `connections` (default: `public`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "667a...",
    "user": {
      "_id": "userId",
      "profile": {
        "firstName": "أحمد",
        "lastName": "علي",
        "headline": "مطور",
        "avatar": "http://..."
      }
    },
    "content": "نص المنشور",
    "image": null,
    "visibility": "public",
    "likes": [],
    "comments": [],
    "createdAt": "2025-06-28T10:00:00.000Z",
    "updatedAt": "2025-06-28T10:00:00.000Z"
  }
}
```

> **Note:** يتم تقييم المحتوى تلقائياً بالذكاء الاصطناعي. المحتوى غير اللائق يُحذف ويُسجل إنذار للمستخدم.

---

### 4.2 GET /posts — جلب جميع المنشورات

**Access:** Private

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | رقم الصفحة |
| limit | Number | 10 | عدد النتائج في الصفحة |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "667a...",
      "user": { "...user info..." },
      "content": "...",
      "image": null,
      "visibility": "public",
      "likes": ["userId1", "userId2"],
      "comments": [
        {
          "_id": "commentId",
          "user": { "...user info..." },
          "content": "تعليق رائع!",
          "createdAt": "2025-06-28T11:00:00.000Z"
        }
      ],
      "createdAt": "2025-06-28T10:00:00.000Z",
      "updatedAt": "2025-06-28T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### 4.3 PUT /posts/:postId — تعديل منشور

**Access:** Private (صاحب المنشور فقط)

**Request Body:**

```json
{
  "content": "المحتوى المعدل",
  "image": "https://example.com/new-image.jpg",
  "visibility": "connections"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "...updated post..." }
}
```

---

### 4.4 DELETE /posts/:postId — حذف منشور

**Access:** Private (صاحب المنشور فقط)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم حذف المنشور بنجاح"
}
```

---

### 4.5 POST /posts/:postId/like — إعجاب / إلغاء إعجاب (Toggle)

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "isLiked": true,
  "likesCount": 12
}
```

---

### 4.6 POST /posts/:postId/comments — إضافة تعليق

**Access:** Private  
**Rate Limit:** 5 تعليقات في الدقيقة

**Request Body:**

```json
{
  "content": "نص التعليق"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "تمت إضافة التعليق بنجاح",
  "commentsCount": 8
}
```

---

### 4.7 DELETE /posts/:postId/comments/:commentId — حذف تعليق

**Access:** Private (صاحب التعليق أو صاحب المنشور)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم حذف التعليق بنجاح",
  "commentsCount": 7
}
```

---

## 5. Companies

### 5.1 POST /companies — إنشاء شركة جديدة

**Access:** Private

**Request Body:**

```json
{
  "name": "شركة التقنية المتطورة",
  "description": "شركة رائدة في مجال تقنية المعلومات",
  "industry": "تقنية معلومات",
  "location": "الرياض، السعودية",
  "companySize": "51-200",
  "foundedYear": 2015,
  "website": "https://example.com",
  "socialLinks": {
    "linkedin": "https://linkedin.com/company/...",
    "twitter": "https://twitter.com/..."
  },
  "contactEmail": "info@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | ✅ | اسم الشركة (فريد) |
| description | String | ✅ | وصف الشركة |
| industry | String | ✅ | مجال الشركة |
| location | String | ✅ | المقر الرئيسي |
| companySize | String | ❌ | `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1000+` |
| foundedYear | Number | ❌ | سنة التأسيس |
| website | String | ❌ | الموقع الإلكتروني |
| socialLinks.linkedin | String | ❌ | رابط LinkedIn |
| socialLinks.twitter | String | ❌ | رابط Twitter |
| contactEmail | String | ❌ | بريد التواصل |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "companyId",
    "name": "شركة التقنية المتطورة",
    "description": "...",
    "industry": "تقنية معلومات",
    "location": "الرياض، السعودية",
    "companySize": "51-200",
    "foundedYear": 2015,
    "logo": "default-company-logo.png",
    "coverPhoto": "default-company-cover.png",
    "website": "https://example.com",
    "socialLinks": { "linkedin": "...", "twitter": "..." },
    "contactEmail": "info@example.com",
    "isVerified": false,
    "status": "Pending",
    "owner": "userId",
    "admins": ["userId"],
    "followers": [],
    "followersCount": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

> **Note:** الشركة الجديدة تكون بحالة `Pending` وتنتظر موافقة المشرف.

---

### 5.2 GET /companies — جلب جميع الشركات

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "companyId",
      "name": "شركة التقنية",
      "description": "...",
      "industry": "تقنية معلومات",
      "location": "الرياض",
      "companySize": "51-200",
      "logo": "default-company-logo.png",
      "status": "Approved",
      "isVerified": true,
      "owner": { "_id": "userId", "profile": { "firstName": "...", "lastName": "...", "avatar": "..." } }
    }
  ]
}
```

---

### 5.3 GET /companies/:id — جلب شركة محددة

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "...company data..." }
}
```

---

### 5.4 POST /companies/:id/follow — متابعة / إلغاء متابعة شركة (Toggle)

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "isFollowing": true,
  "followersCount": 25
}
```

---

### 5.5 POST /companies/:id/admins — إضافة مدير للشركة

**Access:** Private (مالك الشركة فقط)

**Request Body:**

```json
{
  "newAdminId": "667a1b2c3d4e5f6a7b8c9d0e"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تمت إضافة المدير بنجاح",
  "adminsCount": 3
}
```

---

## 6. Jobs

### 6.1 GET /jobs — جلب جميع الوظائف

**Access:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `Full-time`, `Part-time`, `Contract`, `Internship`, `Freelance` |
| workPlace | String | `On-site`, `Remote`, `Hybrid` |
| workLevel | String | `Entry`, `Mid`, `Senior`, `Director`, `VP` |

**Response (200 OK):**

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "jobId",
      "title": "مهندس برمجيات",
      "description": "...",
      "company": {
        "_id": "companyId",
        "name": "شركة التقنية",
        "logo": "default-company-logo.png",
        "location": "الرياض"
      },
      "location": "الرياض",
      "type": "Full-time",
      "workLevel": "Mid",
      "workPlace": "On-site",
      "salary": { "min": 5000, "max": 15000, "currency": "USD" },
      "requirements": ["Node.js", "MongoDB"],
      "responsibilities": ["..."],
      "status": "Open",
      "createdAt": "..."
    }
  ]
}
```

---

### 6.2 POST /jobs — نشر وظيفة جديدة

**Access:** Private (يجب أن يكون مديراً في الشركة)

**Request Body:**

```json
{
  "companyId": "companyId",
  "title": "مهندس برمجيات",
  "description": "وصف الوظيفة",
  "location": "الرياض",
  "type": "Full-time",
  "workLevel": "Mid",
  "workPlace": "On-site",
  "salary": { "min": 5000, "max": 15000 },
  "requirements": ["Node.js", "MongoDB", "Express"],
  "responsibilities": ["تطوير واجهات API", "إدارة قواعد البيانات"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": { "...job data..." }
}
```

---

### 6.3 POST /jobs/:id/apply — التقديم على وظيفة

**Access:** Private

**Request Body:**

```json
{
  "resumeLink": "https://example.com/resume.pdf",
  "coverLetter": "نص خطاب التقديم"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| resumeLink | String | ❌ | رابط السيرة الذاتية |
| coverLetter | String | ❌ | خطاب التقديم |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "تم إرسال طلب التقديم بنجاح! حظاً موفقاً 🚀",
  "data": { "...application data..." }
}
```

---

### 6.4 GET /jobs/:id/applicants — جلب المتقدمين لوظيفة

**Access:** Private (مدير الشركة فقط)

**Response (200 OK):**

```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "applicationId",
      "job": "jobId",
      "applicant": {
        "_id": "userId",
        "email": "user@example.com",
        "profile": {
          "firstName": "أحمد",
          "lastName": "علي",
          "headline": "مطور برمجيات",
          "avatar": "http://..."
        }
      },
      "resumeLink": "https://...",
      "coverLetter": "...",
      "status": "Pending",
      "createdAt": "..."
    }
  ]
}
```

---

### 6.5 PUT /jobs/applications/:applicationId/status — تحديث حالة طلب

**Access:** Private (مدير الشركة فقط)

**Request Body:**

```json
{
  "status": "Shortlisted"
}
```

| Value | Description |
|-------|-------------|
| Pending | قيد المراجعة |
| Reviewed | تمت المراجعة |
| Shortlisted | تم الترشيح |
| Rejected | مرفوض |
| Accepted | مقبول |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم تحديث حالة الطلب إلى Shortlisted بنجاح",
  "data": { "...application data..." }
}
```

---

### 6.6 GET /jobs/my-applications — جلب طلباتي

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "applicationId",
      "job": {
        "_id": "jobId",
        "title": "مهندس برمجيات",
        "location": "الرياض",
        "type": "Full-time",
        "salary": { "min": 5000, "max": 15000 },
        "company": { "name": "شركة التقنية", "logo": "..." }
      },
      "status": "Pending",
      "createdAt": "..."
    }
  ]
}
```

---

## 7. Salaries

### 7.1 GET /salaries — جلب بيانات الرواتب

**Access:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| title | String | المسمى الوظيفي (بحث جزئي) |
| country | String | الدولة (بحث جزئي) |
| category | String | التصنيف (بحث جزئي) |
| experienceLevel | String | `Entry`, `Mid`, `Senior` |
| page | Number | رقم الصفحة (default: 1) |
| limit | Number | عدد النتائج (default: 20) |

**Response (200 OK):**

```json
{
  "success": true,
  "count": 15,
  "pagination": {
    "totalRecords": 150,
    "currentPage": 1,
    "totalPages": 10
  },
  "data": [
    {
      "_id": "salaryId",
      "title": "Software Engineer",
      "category": "Engineering",
      "country": "United States",
      "experienceLevel": "Mid",
      "minSalaryUSD": 70000,
      "maxSalaryUSD": 120000,
      "medianSalaryUSD": 95000
    }
  ]
}
```

---

### 7.2 GET /salaries/options — جلب خيارات الفلترة

**Access:** Public

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "titles": ["Software Engineer", "Data Scientist", "Product Manager"],
    "countries": ["Saudi Arabia", "United States", "UAE"],
    "categories": ["Engineering", "Data Science", "Management"],
    "experienceLevels": ["Entry", "Mid", "Senior"]
  }
}
```

---

### 7.3 GET /salaries/stats — جلب إحصائيات الرواتب

**Access:** Public

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| title | String | تصفية حسب المسمى الوظيفي |
| country | String | تصفية حسب الدولة |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "Saudi Arabia",
      "averageMin": 50000,
      "averageMax": 100000,
      "averageMedian": 75000,
      "totalRecords": 25
    }
  ]
}
```

> **Note:** إذا تم إرسال `title` يتم التجميع حسب `country`، والعكس.

---

## 8. Messaging

### 8.1 POST /messages/conversations — بدء أو جلب محادثة

**Access:** Private

**Request Body:**

```json
{
  "recipientId": "667a1b2c3d4e5f6a7b8c9d0e"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "conversationId",
    "participants": [
      { "_id": "userId1", "profile": { "firstName": "...", "lastName": "...", "avatar": "..." } },
      { "_id": "userId2", "profile": { "firstName": "...", "lastName": "...", "avatar": "..." } }
    ],
    "lastMessage": null,
    "lastMessageAt": "2025-06-28T10:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 8.2 GET /messages/conversations — جلب جميع المحادثات

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "conversationId",
      "participants": [ "...populated..." ],
      "lastMessage": {
        "_id": "messageId",
        "content": "آخر رسالة",
        "sender": "userId",
        "isRead": true,
        "createdAt": "..."
      },
      "lastMessageAt": "2025-06-28T12:00:00.000Z"
    }
  ]
}
```

---

### 8.3 GET /messages/conversations/:conversationId — جلب رسائل محادثة

**Access:** Private (طرف في المحادثة)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | رقم الصفحة |
| limit | Number | 30 | عدد الرسائل |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "messageId",
      "conversation": "conversationId",
      "sender": {
        "_id": "userId",
        "profile": { "firstName": "...", "lastName": "...", "avatar": "..." }
      },
      "content": "نص الرسالة",
      "isRead": true,
      "createdAt": "2025-06-28T12:00:00.000Z"
    }
  ]
}
```

> **Note:** يتم تحديث الرسائل الواردة كمقروءة تلقائياً عند جلبها.

---

### 8.4 POST /messages/conversations/:conversationId — إرسال رسالة

**Access:** Private (طرف في المحادثة)

**Request Body:**

```json
{
  "content": "نص الرسالة"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "messageId",
    "conversation": "conversationId",
    "sender": {
      "_id": "userId",
      "profile": { "firstName": "...", "lastName": "...", "avatar": "..." }
    },
    "content": "نص الرسالة",
    "isRead": false,
    "createdAt": "2025-06-28T12:00:00.000Z"
  }
}
```

---

### 8.5 GET /messages/unread — جلب عدد الرسائل غير المقروءة

**Access:** Private

**Response (200 OK):**

```json
{
  "success": true,
  "unreadCount": 5
}
```

---

## 9. Admin

> **Note:** جميع مسارات Admin تتطلب صلاحية `Admin` بالإضافة إلى التوكن.

### 9.1 GET /admin/companies/pending — جلب الشركات المعلقة

**Access:** Private/Admin

**Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "companyId",
      "name": "شركة جديدة",
      "status": "Pending",
      "owner": {
        "_id": "userId",
        "profile": { "firstName": "...", "lastName": "..." },
        "email": "owner@example.com"
      }
    }
  ]
}
```

---

### 9.2 PUT /admin/companies/:id/status — الموافقة أو رفض شركة

**Access:** Private/Admin

**Request Body:**

```json
{
  "status": "Approved"
}
```

| Value | Description |
|-------|-------------|
| Approved | موافقة (تصبح الشركة موثقة) |
| Rejected | رفض |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "تم تغيير حالة الشركة إلى Approved",
  "data": { "...company data..." }
}
```

---

## 10. Database Schemas

### 10.1 User

**Collection:** `users`

| Field | Type | Description |
|-------|------|-------------|
| email | String, unique, required | البريد الإلكتروني |
| password | String, required, select:false | كلمة المرور (مشفرة) |
| username | String, unique | اسم المستخدم (يُولد تلقائياً) |
| role | String, enum: `Student`, `Professional`, `Admin` | نوع الحساب |
| profile.firstName | String, required | الاسم الأول |
| profile.lastName | String, required | اسم العائلة |
| profile.fullname | String | الاسم الكامل (يُولد تلقائياً) |
| profile.phoneNumber | String | رقم الهاتف |
| profile.headline | String | المسمى الوظيفي |
| profile.bio | String | السيرة الذاتية |
| profile.avatar | String, default: `default-avatar.png` | رابط الصورة الشخصية |
| profile.location | String | الموقع |
| profile.socialLinks | `{ linkedin, github, website }` | روابط التواصل الاجتماعي |
| profile.followers | [ObjectId] (ref: User) | قائمة المتابعين |
| profile.following | [ObjectId] (ref: User) | قائمة المتابَعين |
| profile.followersCount | Number | عدد المتابعين |
| profile.followingCount | Number | عدد المتابَعين |
| profile.postsCount | Number | عدد المنشورات |
| profile.rScore | Number, default: 0 | نقاط السمعة |
| professional.industry | String | المجال المهني |
| professional.yearsOfExperience | Number | سنوات الخبرة |
| professional.skills | [String] | المهارات |
| isActive | Boolean, default: true | الحساب نشط |
| isVerified | Boolean, default: true | الحساب موثق |
| status | String, enum: `active`, `banned` | حالة الحساب |
| settings.language | String, enum: `ar`, `en` | اللغة |
| settings.theme | String, enum: `light`, `dark`, `system` | الثيم |
| settings.emailNotifications | Boolean | إشعارات البريد |
| settings.pushNotifications | Boolean | إشعارات التطبيق |
| settings.profileVisibility | String, enum: `public`, `connections`, `private` | خصوصية الملف |
| settings.showEmail | Boolean | إظهار البريد |
| settings.showPhone | Boolean | إظهار الهاتف |
| bannedUntil | Date | مدة الحظر (إذا كان مؤقتاً) |
| warnings | `[{ content, reason, date }]` | سجل الإنذارات |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

---

### 10.2 Post

**Collection:** `posts`

| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId (ref: User), required | صاحب المنشور |
| content | String, required | محتوى المنشور |
| image | String, default: null | رابط الصورة |
| visibility | String, enum: `public`, `private`, `connections` | مستوى الرؤية |
| likes | [ObjectId] (ref: User) | قائمة المعجبين |
| comments | `[{ user, content, createdAt }]` | التعليقات (subdocument) |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

---

### 10.3 Company

**Collection:** `companies`

| Field | Type | Description |
|-------|------|-------------|
| name | String, unique, required | اسم الشركة |
| description | String, required | وصف الشركة |
| industry | String, required | المجال |
| location | String, required | الموقع |
| companySize | String, enum: `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1000+` | حجم الشركة |
| foundedYear | Number | سنة التأسيس |
| logo | String, default: `default-company-logo.png` | الشعار |
| coverPhoto | String, default: `default-company-cover.png` | صورة الغلاف |
| website | String | الموقع الإلكتروني |
| socialLinks | `{ linkedin, twitter }` | روابط التواصل |
| contactEmail | String | بريد التواصل |
| isVerified | Boolean, default: false | شركة موثقة |
| status | String, enum: `Pending`, `Approved`, `Rejected` | حالة الموافقة |
| owner | ObjectId (ref: User), required | المالك |
| admins | [ObjectId] (ref: User) | المدراء |
| followers | [ObjectId] (ref: User) | المتابعون |
| followersCount | Number, default: 0 | عدد المتابعين |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

---

### 10.4 Job

**Collection:** `jobs`

| Field | Type | Description |
|-------|------|-------------|
| title | String, required | عنوان الوظيفة |
| description | String, required | وصف الوظيفة |
| company | ObjectId (ref: Company), required | الشركة |
| location | String, required | موقع العمل |
| type | String, enum: `Full-time`, `Part-time`, `Contract`, `Internship`, `Freelance` | نوع الوظيفة |
| workLevel | String, enum: `Entry`, `Mid`, `Senior`, `Director`, `VP` | المستوى الوظيفي |
| workPlace | String, enum: `On-site`, `Remote`, `Hybrid` | مكان العمل |
| salary | `{ min, max, currency }` | الراتب |
| requirements | [String] | المتطلبات |
| responsibilities | [String] | المسؤوليات |
| status | String, enum: `Open`, `Closed` | حالة الوظيفة |
| postedBy | ObjectId (ref: User), required | الناشر |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

---

### 10.5 Job Application (embedded in Job model)

**Collection:** `jobs` (يتم إنشاء وثيقة منفصلة باستخدام Job model نفسه)

| Field | Type | Description |
|-------|------|-------------|
| job | ObjectId (ref: Job), required | الوظيفة |
| applicant | ObjectId (ref: User), required | المتقدم |
| resumeLink | String | رابط السيرة الذاتية |
| coverLetter | String | خطاب التقديم |
| status | String, enum: `Pending`, `Reviewed`, `Shortlisted`, `Rejected`, `Accepted` | حالة الطلب |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

---

### 10.6 Salary

**Collection:** `salaries`

| Field | Type | Description |
|-------|------|-------------|
| title | String, required, indexed | المسمى الوظيفي |
| category | String, required, indexed | التصنيف |
| country | String, required, indexed | الدولة |
| experienceLevel | String, required, enum: `Entry`, `Mid`, `Senior` | مستوى الخبرة |
| minSalaryUSD | Number, required | الحد الأدنى للراتب |
| maxSalaryUSD | Number, required | الحد الأعلى للراتب |
| medianSalaryUSD | Number, required | متوسط الراتب |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

**Indexes:** `{ title: 1 }`, `{ country: 1 }`, `{ category: 1 }`, `{ title: 1, country: 1 }`

---

### 10.7 Conversation

**Collection:** `conversations`

| Field | Type | Description |
|-------|------|-------------|
| participants | [ObjectId] (ref: User), required | المشاركون في المحادثة |
| lastMessage | ObjectId (ref: Message), default: null | آخر رسالة |
| lastMessageAt | Date | تاريخ آخر رسالة |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

**Indexes:** `{ participants: 1 }`

---

### 10.8 Message

**Collection:** `messages`

| Field | Type | Description |
|-------|------|-------------|
| conversation | ObjectId (ref: Conversation), required | المحادثة |
| sender | ObjectId (ref: User), required | المرسل |
| content | String, required | محتوى الرسالة |
| isRead | Boolean, default: false | مقروءة |
| timestamps | `createdAt`, `updatedAt` | التواريخ |

**Indexes:** `{ conversation: 1, createdAt: -1 }`

---

### 10.9 ScoreHistory

**Collection:** `scorehistories`

| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId (ref: User), required | المستخدم |
| actionKey | String, required, indexed | مفتاح الإجراء |
| points | Number, required | عدد النقاط |
| description | String | وصف الإجراء |
| timestamps | `createdAt`, `updatedAt` | التواريخ |
