# Network API Documentation

Base URL: `/api/network`

التوثيق أدناه مبني على التنفيذ الحالي في:
[connectionRoutes.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/routes/connectionRoutes.js)
[connectionController.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/controllers/connectionController.js)
[Connection.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Connection.js)
[User.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/User.js)

## ملاحظات مهمة

- جميع مسارات الشبكة `Private` وتتطلب `Authorization: Bearer <token>`.
- نظام الشبكة مبني على كيان `Connection` يربط بين:
  - `requester`: الشخص الذي أرسل الطلب
  - `recipient`: الشخص الذي استلم الطلب
- حالات الطلب المتاحة في الـ model:
  - `pending`
  - `accepted`
  - `rejected`
- يوجد فهرس `unique` على الزوج `requester + recipient`، لكن الكود أيضًا يمنع وجود أي طلب سابق بين الطرفين في الاتجاهين.

## 1. إرسال طلب اتصال

**Endpoint**

`POST /api/network/connect/:userId`

**Access**

Private

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `userId` | `string` | معرف المستخدم المراد إرسال طلب اتصال له |

**Request Body**

لا يوجد `body`.

**Behavior**

- لا يمكن للمستخدم إرسال طلب إلى نفسه.
- إذا كان هناك طلب أو اتصال سابق بين الطرفين، يتم رفض الطلب.
- عند الإنشاء تكون الحالة الافتراضية `pending`.

**Success Response**

`201 Created`

```json
{
  "success": true,
  "message": "تم إرسال طلب الاتصال بنجاح",
  "data": {
    "_id": "connection_id",
    "requester": "current_user_id",
    "recipient": "target_user_id",
    "status": "pending",
    "createdAt": "2026-03-25T00:00:00.000Z",
    "updatedAt": "2026-03-25T00:00:00.000Z",
    "__v": 0
  }
}
```

**Error Responses**

- `400`: لا يمكنك إرسال طلب اتصال لنفسك
- `400`: هناك طلب اتصال موجود بالفعل بينكما
- `500`: خطأ داخلي

## 2. قبول طلب اتصال

**Endpoint**

`PUT /api/network/accept/:requestId`

**Access**

Private

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `requestId` | `string` | معرف طلب الاتصال |

**Request Body**

لا يوجد `body`.

**Behavior**

- فقط `recipient` الفعلي للطلب يمكنه قبوله.
- عند القبول تتغير الحالة إلى `accepted`.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "message": "تم قبول طلب الاتصال، أنتما الآن متصلان!"
}
```

**Error Responses**

- `404`: طلب الاتصال غير موجود
- `403`: غير مصرح لك بقبول هذا الطلب
- `500`: خطأ داخلي

## 3. جلب الطلبات الواردة المعلقة

**Endpoint**

`GET /api/network/requests`

**Access**

Private

**Behavior**

- يرجع فقط الطلبات التي:
  - `recipient = current user`
  - `status = pending`
- يتم عمل `populate` لبيانات المرسل `requester`.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "connection_id",
      "requester": {
        "_id": "user_id",
        "profile": {
          "firstName": "Ahmad",
          "lastName": "Ali",
          "avatar": "avatar.png",
          "headline": "Frontend Developer"
        }
      },
      "recipient": "current_user_id",
      "status": "pending",
      "createdAt": "2026-03-25T00:00:00.000Z",
      "updatedAt": "2026-03-25T00:00:00.000Z",
      "__v": 0
    }
  ]
}
```

**Error Responses**

- `500`: خطأ داخلي

## 4. جلب جهات الاتصال الحالية

**Endpoint**

`GET /api/network/connections`

**Access**

Private

**Behavior**

- يبحث عن كل العلاقات التي حالتها `accepted` ويكون المستخدم الحالي طرفًا فيها.
- لا يرجع كائنات `Connection` نفسها، بل يرجع بيانات "الشخص الآخر" فقط.
- يتم عمل `populate` على `requester` و`recipient` ثم تصفية الطرف الحالي من النتيجة.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "friend_user_id_1",
      "profile": {
        "firstName": "Sara",
        "lastName": "Khaled",
        "headline": "Backend Developer",
        "avatar": "avatar1.png"
      }
    },
    {
      "_id": "friend_user_id_2",
      "profile": {
        "firstName": "Omar",
        "lastName": "Nasser",
        "headline": "Product Designer",
        "avatar": "avatar2.png"
      }
    }
  ]
}
```

**Error Responses**

- `500`: حدث خطأ أثناء جلب جهات الاتصال

## 5. رفض طلب اتصال

**Endpoint**

`PUT /api/network/reject/:requestId`

**Access**

Private

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `requestId` | `string` | معرف طلب الاتصال |

**Request Body**

لا يوجد `body`.

**Behavior**

- فقط `recipient` الفعلي للطلب يمكنه رفضه.
- لا يتم حذف الطلب، بل تتغير حالته إلى `rejected`.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "message": "تم رفض طلب الاتصال"
}
```

**Error Responses**

- `404`: طلب الاتصال غير موجود
- `403`: غير مصرح لك برفض هذا الطلب
- `500`: حدث خطأ أثناء رفض الطلب

## 6. إزالة اتصال حالي

**Endpoint**

`DELETE /api/network/remove/:userId`

**Access**

Private

**Path Params**

| الحقل | النوع | الوصف |
|---|---|---|
| `userId` | `string` | معرف المستخدم المراد إزالة الاتصال معه |

**Request Body**

لا يوجد `body`.

**Behavior**

- يبحث عن علاقة `accepted` بين المستخدم الحالي والمستخدم الهدف في الاتجاهين.
- إذا وجد العلاقة، يتم حذفها نهائيًا من قاعدة البيانات باستخدام `findOneAndDelete`.

**Success Response**

`200 OK`

```json
{
  "success": true,
  "message": "تم إزالة جهة الاتصال بنجاح"
}
```

**Error Responses**

- `404`: لا توجد جهة اتصال حالية لحذفها
- `500`: حدث خطأ أثناء إزالة جهة الاتصال

## الهيكل الفعلي لـ Connection

الهيكل المؤكد من [Connection.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/Connection.js):

```json
{
  "_id": "string",
  "requester": "ObjectId | populated user object",
  "recipient": "ObjectId | populated user object",
  "status": "pending | accepted | rejected",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## الحقول المرجعة من User داخل قسم الشبكة

الـ populate في هذا القسم يستخدم فقط أجزاء من ملف [User.js](/home/amen/سطح المكتب/ProfitConectBackEnd/src/models/User.js)، وأهمها:

```json
{
  "_id": "string",
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "headline": "string",
    "avatar": "string"
  }
}
```

## ملاحظات تنفيذية

- عند قبول الطلب أو رفضه، الـ API لا يرجع كائن `Connection` المحدث، بل يرجع رسالة فقط.
- عند جلب `connections`، الاستجابة ليست قائمة علاقات، بل قائمة مستخدمين.
- الكود لا يحدّث حقول `followers/following` داخل `User`; نظام الشبكة هنا منفصل ويعتمد فقط على مجموعة `Connection`.
