# Jobs API Documentation

Base URL: `/api/jobs`

التوثيق أدناه مبني على التنفيذ الحالي في:
[jobRoutes.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/routes/jobRoutes.js)
[jobController.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/controllers/jobController.js)
[Job.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Job.js)

## ملاحظات مهمة

- كل المسارات المحمية تتطلب `Authorization: Bearer <token>`.
- حقول `Job` المؤكدة من الـ schema موجودة في [Job.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Job.js).
- مسارات التقديم على الوظائف (`apply`, `applicants`, `update application status`, `my-applications`) تعتمد في الكود الحالي على `JobApplication`، لكن لا يوجد Model مستقل له داخل `src/models`، كما أن الاستيراد الحالي في [jobController.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/controllers/jobController.js) يشير إلى `../models/Job`.
- لذلك، هيكل بيانات طلب التوظيف في هذه المسارات هو "متوقع من الكود" وليس موثقًا عبر Schema فعلي داخل المشروع حاليًا.

## 1. إنشاء وظيفة

**Endpoint**

`POST /api/jobs`

**Access**

Private. يجب أن يكون المستخدم Admin داخل الشركة المحددة، والشركة يجب أن تكون حالتها `Approved`.

**Request Body**

| الحقل | النوع | مطلوب | الوصف |
|---|---|---:|---|
| `companyId` | `string` | نعم | معرف الشركة المستخدمة للنشر |
| `title` | `string` | نعم | عنوان الوظيفة |
| `description` | `string` | نعم | وصف الوظيفة |
| `location` | `string` | نعم | موقع الوظيفة |
| `type` | `string` | لا | واحدة من: `Full-time`, `Part-time`, `Contract`, `Internship`, `Freelance` |
| `workLevel` | `string` | لا | واحدة من: `Entry`, `Mid`, `Senior`, `Director`, `VP` |
| `workPlace` | `string` | لا | واحدة من: `On-site`, `Remote`, `Hybrid` |
| `salary` | `object` | لا | بيانات الراتب |
| `salary.min` | `number` | لا | الحد الأدنى |
| `salary.max` | `number` | لا | الحد الأعلى |
| `salary.currency` | `string` | لا | العملة، الافتراضي `USD` |
| `requirements` | `string[]` | لا | المتطلبات |
| `responsibilities` | `string[]` | لا | المسؤوليات |
| `status` | `string` | لا | `Open` أو `Closed`، الافتراضي `Open` |

**Example Request**

```json
{
  "companyId": "69bed0b0a0d4360dcb82ca02",
  "title": "Frontend Developer",
  "description": "Build and maintain web interfaces",
  "location": "Damascus, Syria",
  "type": "Full-time",
  "workPlace": "Remote",
  "workLevel": "Mid",
  "salary": {
    "min": 1500,
    "max": 2500,
    "currency": "USD"
  },
  "requirements": ["React", "REST APIs"],
  "responsibilities": ["Build UI", "Fix bugs"]
}
```

**Success Response**

`201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "job_id",
    "title": "Frontend Developer",
    "description": "Build and maintain web interfaces",
    "company": "69bed0b0a0d4360dcb82ca02",
    "location": "Damascus, Syria",
    "type": "Full-time",
    "workLevel": "Mid",
    "workPlace": "Remote",
    "salary": {
      "min": 1500,
      "max": 2500,
      "currency": "USD"
    },
    "requirements": ["React", "REST APIs"],
    "responsibilities": ["Build UI", "Fix bugs"],
    "status": "Open",
    "postedBy": "user_id",
    "createdAt": "2026-03-24T00:00:00.000Z",
    "updatedAt": "2026-03-24T00:00:00.000Z",
    "__v": 0
  }
}
```

**Error Responses**

- `400`: الشركة غير موجودة أو ليست `Approved`
- `403`: المستخدم ليس Admin في الشركة
- `500`: خطأ داخلي

## 2. جلب الوظائف

**Endpoint**

`GET /api/jobs`

**Access**

Public

**Query Params**

| الحقل | النوع | مطلوب | الوصف |
|---|---|---:|---|
| `type` | `string` | لا | فلترة حسب نوع الوظيفة |
| `workPlace` | `string` | لا | فلترة حسب مكان العمل |
| `workLevel` | `string` | لا | فلترة حسب المستوى |

ملاحظة: الكود يجلب فقط الوظائف التي حالتها `Open`.

**Example**

`GET /api/jobs?workPlace=Remote&workLevel=Mid`

**Success Response**

`200 OK`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "job_id",
      "title": "Frontend Developer",
      "description": "Build and maintain web interfaces",
      "company": {
        "_id": "company_id",
        "name": "Profit Connect",
        "logo": "logo.png",
        "location": "Syria"
      },
      "location": "Damascus, Syria",
      "type": "Full-time",
      "workLevel": "Mid",
      "workPlace": "Remote",
      "salary": {
        "min": 1500,
        "max": 2500,
        "currency": "USD"
      },
      "requirements": ["React", "REST APIs"],
      "responsibilities": ["Build UI", "Fix bugs"],
      "status": "Open",
      "postedBy": "user_id",
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z",
      "__v": 0
    }
  ]
}
```

**Error Responses**

- `500`: خطأ أثناء جلب الوظائف

## 3. التقديم على وظيفة

**Endpoint**

`POST /api/jobs/:id/apply`

**Access**

Private

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `string` | معرف الوظيفة |

**Request Body**

| الحقل | النوع | مطلوب | الوصف |
|---|---|---:|---|
| `resumeLink` | `string` | لا بحسب الكود | رابط السيرة الذاتية |
| `coverLetter` | `string` | لا بحسب الكود | رسالة التقديم |

**Example Request**

```json
{
  "resumeLink": "https://example.com/resume.pdf",
  "coverLetter": "I am interested in this role."
}
```

**Success Response المتوقعة من الكود**

`201 Created`

```json
{
  "success": true,
  "message": "تم إرسال طلب التقديم بنجاح! حظاً موفقاً 🚀",
  "data": {
    "_id": "application_id",
    "job": "job_id",
    "applicant": "user_id",
    "resumeLink": "https://example.com/resume.pdf",
    "coverLetter": "I am interested in this role.",
    "status": "Pending",
    "createdAt": "2026-03-24T00:00:00.000Z",
    "updatedAt": "2026-03-24T00:00:00.000Z"
  }
}
```

**Error Responses**

- `404`: الوظيفة غير موجودة
- `400`: الوظيفة مغلقة أو المستخدم قدّم سابقًا
- `500`: خطأ داخلي

**ملاحظة تنفيذية**

هذا المسار يعتمد على Model طلب توظيف غير موجود فعليًا داخل المشروع حاليًا، لذلك الاستجابة أعلاه هي البنية المتوقعة من الكود وليست مضمونة التشغيل الآن.

## 4. جلب المتقدمين لوظيفة

**Endpoint**

`GET /api/jobs/:id/applicants`

**Access**

Private. المستخدم يجب أن يكون Admin في الشركة المالكة للوظيفة.

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `string` | معرف الوظيفة |

**Success Response المتوقعة من الكود**

`200 OK`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "application_id",
      "job": "job_id",
      "applicant": {
        "_id": "user_id",
        "profile": {
          "firstName": "Ahmad",
          "lastName": "Ali",
          "headline": "Frontend Developer",
          "avatar": "avatar.png"
        },
        "email": "ahmad@example.com"
      },
      "resumeLink": "https://example.com/resume.pdf",
      "coverLetter": "I am interested in this role.",
      "status": "Pending",
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**

- `404`: الوظيفة غير موجودة
- `403`: المستخدم غير مصرح له
- `500`: خطأ داخلي

**ملاحظة تنفيذية**

يعتمد أيضًا على Model طلبات التوظيف غير الموجود حاليًا.

## 5. تحديث حالة طلب توظيف

**Endpoint**

`PUT /api/jobs/applications/:applicationId/status`

**Access**

Private. المستخدم يجب أن يكون Admin في الشركة المالكة للوظيفة.

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `applicationId` | `string` | معرف طلب التوظيف |

**Request Body**

| الحقل | النوع | مطلوب | القيم المسموحة |
|---|---|---:|---|
| `status` | `string` | نعم | `Pending`, `Reviewed`, `Shortlisted`, `Rejected`, `Accepted` |

**Example Request**

```json
{
  "status": "Shortlisted"
}
```

**Success Response المتوقعة من الكود**

`200 OK`

```json
{
  "success": true,
  "message": "تم تحديث حالة الطلب إلى Shortlisted بنجاح",
  "data": {
    "_id": "application_id",
    "job": {
      "_id": "job_id",
      "company": {
        "_id": "company_id"
      }
    },
    "applicant": "user_id",
    "resumeLink": "https://example.com/resume.pdf",
    "coverLetter": "I am interested in this role.",
    "status": "Shortlisted",
    "createdAt": "2026-03-24T00:00:00.000Z",
    "updatedAt": "2026-03-24T00:00:00.000Z"
  }
}
```

**Error Responses**

- `400`: قيمة `status` غير صالحة
- `404`: طلب التوظيف غير موجود
- `403`: المستخدم غير مصرح له
- `500`: خطأ داخلي

**ملاحظة تنفيذية**

يعتمد أيضًا على Model طلبات التوظيف غير الموجود حاليًا.

## 6. جلب طلبات المستخدم الحالية

**Endpoint**

`GET /api/jobs/my-applications`

**Access**

Private

**Success Response المتوقعة من الكود**

`200 OK`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "application_id",
      "job": {
        "_id": "job_id",
        "title": "Frontend Developer",
        "location": "Damascus, Syria",
        "type": "Full-time",
        "salary": {
          "min": 1500,
          "max": 2500,
          "currency": "USD"
        },
        "company": {
          "_id": "company_id",
          "name": "Profit Connect",
          "logo": "logo.png"
        }
      },
      "applicant": "user_id",
      "resumeLink": "https://example.com/resume.pdf",
      "coverLetter": "I am interested in this role.",
      "status": "Pending",
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**

- `500`: خطأ أثناء جلب طلبات المستخدم

**ملاحظة تنفيذية**

يعتمد أيضًا على Model طلبات التوظيف غير الموجود حاليًا.

## الهيكل الفعلي لـ Job

الهيكل المؤكد من الـ schema:

```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "company": "ObjectId | populated company object",
  "location": "string",
  "type": "Full-time | Part-time | Contract | Internship | Freelance",
  "workLevel": "Entry | Mid | Senior | Director | VP",
  "workPlace": "On-site | Remote | Hybrid",
  "salary": {
    "min": "number",
    "max": "number",
    "currency": "string"
  },
  "requirements": ["string"],
  "responsibilities": ["string"],
  "status": "Open | Closed",
  "postedBy": "ObjectId",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## الهيكل المتوقع لـ JobApplication

هذا الهيكل مستنتج من طريقة الاستخدام داخل [jobController.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/controllers/jobController.js):

```json
{
  "_id": "string",
  "job": "ObjectId | populated job object",
  "applicant": "ObjectId | populated user object",
  "resumeLink": "string",
  "coverLetter": "string",
  "status": "Pending | Reviewed | Shortlisted | Rejected | Accepted",
  "createdAt": "date",
  "updatedAt": "date"
}
```
