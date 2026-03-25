# Salaries API Documentation

Base URL: `/api/salaries`

التوثيق أدناه مبني على التنفيذ الحالي في:
[salaryRoutes.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/routes/salaryRoutes.js)
[salaryController.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/controllers/salaryController.js)
[Salary.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Salary.js)

## ملاحظات مهمة

- جميع مسارات الرواتب `Public` ولا تحتاج توكن.
- القسم الحالي يحتوي 3 endpoints فقط:
  - `GET /api/salaries`
  - `GET /api/salaries/options`
  - `GET /api/salaries/stats`
- بيانات الرواتب مبنية على Model مستقل باسم `Salary`.
- يوجد ملف بيانات داخل المشروع في [salaries.csv](/home/amen/سطح المكتب/ProfitConectBackEnd/data/salaries.csv) يحتوي أمثلة/بيانات أولية مطابقة تقريبًا لحقول الـ model.

## 1. جلب الرواتب

**Endpoint**

`GET /api/salaries`

**Access**

Public

**Query Params**

| الحقل | النوع | مطلوب | الوصف |
|---|---|---:|---|
| `title` | `string` | لا | بحث جزئي غير حساس لحالة الأحرف داخل المسمى الوظيفي |
| `country` | `string` | لا | بحث جزئي غير حساس لحالة الأحرف داخل الدولة |
| `category` | `string` | لا | بحث جزئي غير حساس لحالة الأحرف داخل التصنيف |
| `experienceLevel` | `string` | لا | مطابقة مباشرة لقيمة المستوى |
| `page` | `number` | لا | رقم الصفحة، الافتراضي `1` |
| `limit` | `number` | لا | عدد النتائج في الصفحة، الافتراضي `20` |

**Allowed `experienceLevel` Values**

`Entry`, `Mid`, `Senior`

**Sorting**

النتائج تُرتّب تنازليًا حسب `medianSalaryUSD`.

**Example Requests**

`GET /api/salaries?title=Frontend Developer`

`GET /api/salaries?country=Syria&experienceLevel=Mid&page=1&limit=10`

`GET /api/salaries?category=Engineering`

**Success Response**

`200 OK`

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "totalRecords": 12,
    "currentPage": 1,
    "totalPages": 6
  },
  "data": [
    {
      "_id": "salary_id_1",
      "title": "Frontend Developer",
      "category": "Engineering",
      "country": "USA",
      "experienceLevel": "Senior",
      "minSalaryUSD": 140000,
      "maxSalaryUSD": 190000,
      "medianSalaryUSD": 160000,
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "salary_id_2",
      "title": "Frontend Developer",
      "category": "Engineering",
      "country": "Canada",
      "experienceLevel": "Senior",
      "minSalaryUSD": 115000,
      "maxSalaryUSD": 150000,
      "medianSalaryUSD": 130000,
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z",
      "__v": 0
    }
  ]
}
```

**Error Response**

`500 Internal Server Error`

```json
{
  "success": false,
  "message": "حدث خطأ أثناء جلب البيانات"
}
```

## 2. جلب خيارات الفلاتر

**Endpoint**

`GET /api/salaries/options`

**Access**

Public

**Purpose**

يرجع القيم الفريدة المتاحة لاستخدامها في الفلاتر داخل الواجهة.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "data": {
    "titles": [
      "Backend Developer",
      "Frontend Developer",
      "Product Manager"
    ],
    "countries": [
      "Canada",
      "Syria",
      "USA"
    ],
    "categories": [
      "Engineering",
      "Product"
    ],
    "experienceLevels": [
      "Entry",
      "Mid",
      "Senior"
    ]
  }
}
```

**Behavior Notes**

- `titles`, `countries`, `categories` يتم ترتيبها أبجديًا داخل الكود.
- `experienceLevels` يتم إرجاعها كما تأتي من قاعدة البيانات بدون `sort()` صريح.

**Error Response**

`500 Internal Server Error`

```json
{
  "success": false,
  "message": "حدث خطأ أثناء جلب خيارات الفلترة"
}
```

## 3. جلب الإحصائيات

**Endpoint**

`GET /api/salaries/stats`

**Access**

Public

**Query Params**

| الحقل | النوع | مطلوب | الوصف |
|---|---|---:|---|
| `title` | `string` | لا | فلترة جزئية حسب المسمى الوظيفي |
| `country` | `string` | لا | فلترة جزئية حسب الدولة |

**آلية التجميع الحالية**

- إذا أرسلت `title` فقط، يتم التجميع حسب الدولة `country`.
- إذا لم ترسل `title`، يتم التجميع حسب المسمى الوظيفي `title`.
- إذا أرسلت `title` و`country` معًا، يبقى التجميع حسب الدولة لأن الكود يفحص وجود `title` فقط لتحديد `_id`.

**Example Requests**

`GET /api/salaries/stats`

`GET /api/salaries/stats?title=Frontend Developer`

`GET /api/salaries/stats?country=USA`

**Success Response عند الإرسال بدون فلاتر**

`200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "Frontend Developer",
      "averageMin": 42000,
      "averageMax": 61000,
      "averageMedian": 50500,
      "totalRecords": 12
    },
    {
      "_id": "Backend Developer",
      "averageMin": 39000,
      "averageMax": 58000,
      "averageMedian": 47000,
      "totalRecords": 10
    }
  ]
}
```

**Success Response عند الإرسال مع `title`**

`200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "USA",
      "averageMin": 103333.33,
      "averageMax": 140000,
      "averageMedian": 119000,
      "totalRecords": 3
    },
    {
      "_id": "Canada",
      "averageMin": 83333.33,
      "averageMax": 111666.67,
      "averageMedian": 96666.67,
      "totalRecords": 3
    }
  ]
}
```

**Behavior Notes**

- يتم حساب:
  - `averageMin` من `minSalaryUSD`
  - `averageMax` من `maxSalaryUSD`
  - `averageMedian` من `medianSalaryUSD`
  - `totalRecords` بعدد السجلات داخل كل مجموعة
- النتائج تُرتّب تنازليًا حسب `averageMedian`.

**Error Response**

`500 Internal Server Error`

```json
{
  "success": false,
  "message": "حدث خطأ أثناء حساب الإحصائيات"
}
```

## الهيكل الفعلي لـ Salary

الهيكل المؤكد من [Salary.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Salary.js):

```json
{
  "_id": "string",
  "title": "string",
  "category": "string",
  "country": "string",
  "experienceLevel": "Entry | Mid | Senior",
  "minSalaryUSD": "number",
  "maxSalaryUSD": "number",
  "medianSalaryUSD": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## الفهارس الحالية

الـ model يعرّف الفهارس التالية:

- `title`
- `country`
- `category`
- فهرس مركب: `title + country`

وهذا يعني أن القسم مهيأ للبحث والفلترة أكثر من كونه قسم إنشاء أو تعديل بيانات من الـ API الحالي.
