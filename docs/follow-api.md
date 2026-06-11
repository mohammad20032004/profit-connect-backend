
# توثيق نظام المتابعة (Follow System)

## نظرة عامة

تم إعادة تصميم نظام العلاقات بين المستخدمين بالكامل ليصبح نظام **متابعة (Follow/Unfollow)** مباشر، وهو النموذج الأكثر شيوعًا في الشبكات الاجتماعية الحديثة. تم التخلي عن نظام "طلبات الاتصال" (Connection Requests) السابق الذي كان يتطلب موافقة الطرف الآخر.

**كيف يعمل الآن؟**
- يمكن لأي مستخدم متابعة أي مستخدم آخر مباشرة.
- لا يتطلب الأمر موافقة من الطرف الآخر.
- عندما يتابع المستخدم (أ) المستخدم (ب)، يصبح (أ) "متابِعًا" (Follower) لـ (ب)، ويصبح (ب) "متابَعًا" (Following) بواسطة (أ).
- يمكن لأي مستخدم إلغاء متابعته لمستخدم آخر في أي وقت.

---

## واجهات الـ API الجديدة (Endpoints)

### 1. متابعة مستخدم

يقوم هذا الـ Endpoint بإضافة مستخدم إلى قائمة "المتابَعين" (following) للمستخدم الحالي، وإضافة المستخدم الحالي إلى قائمة "المتابِعين" (followers) للمستخدم الهدف.

- **Endpoint:** `POST /api/users/:userId/follow`
- **Method:** `POST`
- **Access:** `Private` (يتطلب توكن مصادقة `Authorization: Bearer <token>`)

**Path Params:**

| الحقل   | النوع   | الوصف                                |
| :------- | :------- | :------------------------------------ |
| `userId` | `string` | **مطلوب.**معرف المستخدم المراد متابعته. |

**Request Body:**

لا يوجد.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "تمت متابعة المستخدم بنجاح"
}
```

**Error Responses:**

- **400 Bad Request:** في حال حاول المستخدم متابعة نفسه.
  ```json
  {
    "success": false,
    "message": "لا يمكنك متابعة نفسك"
  }
  ```
- **400 Bad Request:** في حال كان المستخدم يتابع المستخدم الهدف بالفعل.
  ```json
  {
    "success": false,
    "message": "أنت تتابع هذا المستخدم بالفعل"
  }
  ```
- **404 Not Found:** في حال كان المستخدم الهدف غير موجود.
  ```json
  {
    "success": false,
    "message": "المستخدم غير موجود"
  }
  ```
- **500 Internal Server Error:** خطأ عام في الخادم.

---

### 2. إلغاء متابعة مستخدم

يقوم هذا الـ Endpoint بإزالة مستخدم من قائمة "المتابَعين" (following) للمستخدم الحالي، وإزالة المستخدم الحالي من قائمة "المتابِعين" (followers) للمستخدم الهدف.

- **Endpoint:** `DELETE /api/users/:userId/follow`
- **Method:** `DELETE`
- **Access:** `Private` (يتطلب توكن مصادقة `Authorization: Bearer <token>`)

**Path Params:**

| الحقل   | النوع   | الوصف                                      |
| :------- | :------- | :------------------------------------------ |
| `userId` | `string` | **مطلوب.** معرف المستخدم المراد إلغاء متابعته. |

**Request Body:**

لا يوجد.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "تم إلغاء متابعة المستخدم بنجاح"
}
```

**Error Responses:**

- **404 Not Found:** في حال كان المستخدم الهدف غير موجود.
  ```json
  {
    "success": false,
    "message": "المستخدم غير موجود"
  }
  ```
- **500 Internal Server Error:** خطأ عام في الخادم.

---

## البيانات المعززة في `/api/auth/me`

تم تحديث الـ Endpoint الخاص بجلب بيانات المستخدم المسجل دخوله (`/api/auth/me`) ليصبح أكثر شمولية وغنى بالمعلومات.

- **Endpoint:** `GET /api/auth/me`
- **Method:** `GET`
- **Access:** `Private` (يتطلب توكن مصادقة `Authorization: Bearer <token>`)

**البيانات المرجعة (Success Response - 200 OK):**

الاستجابة الآن تعيد كائن `user` يحتوي على ملفه الشخصي الكامل بالإضافة إلى جميع نشاطاته المرتبطة به.

```json
{
  "success": true,
  "user": {
    "id": "current_user_id",
    "email": "user@example.com",
    "role": "Professional",
    "profile": {
      "firstName": "Ahmed",
      "lastName": "Ali",
      "fullname": "Ahmed Ali",
      "headline": "Software Engineer",
      "avatar": "http://localhost:5000/uploads/avatar.png",
      // ... (بقية حقول الملف الشخصي)
      "followersCount": 150,
      "followingCount": 42,
      "followers": [
        {
          "_id": "follower_user_id_1",
          "profile": {
            "firstName": "Sara",
            "lastName": "Khaled",
            "avatar": "http://localhost:5000/uploads/avatar2.png"
          }
        },
        // ... (بقية المتابعين)
      ],
      "following": [
        {
          "_id": "following_user_id_1",
          "profile": {
            "firstName": "Omar",
            "lastName": "Nasser",
            "avatar": "http://localhost:5000/uploads/avatar3.png"
          }
        }
        // ... (بقية من يتابعهم)
      ]
    },
    // --- البيانات الجديدة المضافة ---
    "posts": [
      {
        "_id": "post_id_1",
        "content": "هذا هو محتوى منشوري الأول!",
        "media": [],
        "likes": [],
        "comments": [],
        "user": "current_user_id",
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      },
      // ... (بقية المنشورات)
    ]
  }
}
```

**ملخص البيانات المضافة:**
- **`posts`**: مصفوفة (Array) تحتوي على جميع كائنات المنشورات التي قام بها المستخدم، مرتبة من الأحدث إلى الأقدم.
- **`profile.followers`**: مصفوفة تحتوي على كائنات جزئية للمستخدمين الذين يتابعونك (اسمهم الأول، الأخير، وصورتهم الرمزية).
- **`profile.following`**: مصفوفة تحتوي على كائنات جزئية للمستخدمين الذين تتابعهم أنت.
