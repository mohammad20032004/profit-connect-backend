# مخططات UML — Profit Connect Backend

هذا المجلد يحتوي على ملفات [PlantUML](https://plantuml.com) التي توثّق بنية منصة **Profit Connect** (باك-إند Node.js + Express + MongoDB).

## المخططات المتوفرة

### diagrams مخططات البنية (Structure)
| المخطط | الملف | ماذا يغطي |
|---|---|---|
| Use Case | `use-case/use-case.puml` | الأدوار الستة (زائر، باحث، صاحب عمل، عميل مشاريع، موظف شركة، مشرف) وكل الوظائف |
| Class Diagram | `class-diagram/class-diagram.puml` | جميع نماذج Mongoose وعلاقاتها والتعدادات |
| ERD | `erd/erd.puml` | علاقات الكيانات والبطاقات والفهارس الفريدة |

### مخططات التسلسل (Sequence)
| المخطط | الملف | ماذا يغطي |
|---|---|---|
| Auth | `sequence/auth-sequence.puml` | التسجيل، الدخول، تأكيد البريد، حماية المسارات، تجديد التوكن، الخروج |
| Escrow | `sequence/escrow-payment-sequence.puml` | دورة المشروع الحر من العروض حتى الدفع والتحرير |
| Withdrawal | `sequence/withdrawal-sequence.puml` | طلب السحب ومراجعته من الإدارة والإلغاء |
| AI Moderation | `sequence/ai-moderation-sequence.puml` | فحص المحتوى وكشف النص المولّد بالذكاء الاصطناعي |
| Social | `sequence/social-sequence.puml` | الاتصالات والمتابعة والمراسلة |
| Password Reset | `sequence/password-reset-sequence.puml` | إعادة تعيين كلمة المرور عبر EmailJS (3 خطوات) |
| Email Verification | `sequence/email-verification-sequence.puml` | تأكيد البريد الإلكتروني عبر EmailJS |
| Post Report | `sequence/post-report-sequence.puml` | الإبلاغ عن منشور + مراجعة الإدارة |

### مخططات النشاط (Activity)
| المخطط | الملف | ماذا يغطي |
|---|---|---|
| Post Moderation | `activity/post-moderation-activity.puml` | تدفق نشر منشور مع المراقبة والنقاط |
| Escrow | `activity/escrow-activity.puml` | دورة الإيداع والتحرير والاسترجاع |
| Password Reset | `activity/password-reset-activity.puml` | تدفق إعادة تعيين كلمة المرور بالكامل |
| Email Verification | `activity/email-verification-activity.puml` | تدفق تأكيد البريد الإلكتروني |
| Post Report | `activity/post-report-activity.puml` | تدفق الإبلاغ عن منشور + الحدود التلقائية |

### مخططات الحالات (State)
| المخطط | الملف | ماذا يغطي |
|---|---|---|
| Project | `state/project-state.puml` | حالات المشروع الحر |
| Financial | `state/financial-state.puml` | حالات الدفعة المحجوزة وطلبات السحب |
| User/Company | `state/user-status-state.puml` | حالات المستخدم (مع تأكيد البريد) والشركة والاتصال |
| Post Status | `state/post-status-state.puml` | حالات المنشور (active/hidden/deleted) |

### مخططات أخرى
| المخطط | الملف | ماذا يغطي |
|---|---|---|
| Component | `component/component.puml` | الطبقات (routes → controllers → services → models) |
| Package | `package/package.puml` | حزم المشروع وفق بنية `src/` |
| Deployment | `deployment/deployment.puml` | النشر: الواجهة، السيرفر، MongoDB، خدمات الذكاء الاصطناعي |

## كيفية التصيير (Rendering)

الخيارات (اختر واحداً):

1. **VS Code**: ثبّت إضافة *PlantUML* ثم `Alt + D` لمعاينة المخطط.
2. **أونلاين**: ارفع الملف في https://www.plantuml.com/plantuml/uml
3. **سطر الأوامر** (يتطلب Java):
   ```bash
   java -jar plantuml.jar UML/**/*.puml -o ../rendered
   ```

## ملاحظات النمذجة

- المخططات مبنية من الكود الفعلي (الملفات في `src/models` و`src/routes` و`src/controllers` و`src/services`).
- النظام المالي يستخدم **الحساب الضامن (Escrow)**: الانتقال `held → released/refunded` حصري عبر `moneyService` لمنع التحرير المزدوج.
- سجل الحركات `MoneyTransaction` هو *دفتر الأستاذ* (Ledger) لكل تغيير في الرصيد.
- تقييم الذكاء الاصطناعي يعتمد نموذجاً محلياً (LM Studio) مع نموذج احتياطي (OpenAI)، والكشف عن المحتوى المولّد يعمل بالنموذج المحلي فقط.
- **العملة الموحدة:** USD في جميع المعاملات المالية.
- **تأكيد البريد:** جديد عند التسجيل، مطلوب لتسجيل الدخول.
- **إعادة تعيين كلمة المرور:** عبر EmailJS مع كود 6 أرقام صالح 10 دقائق.
- **الإبلاغ عن المنشورات:** حدود تلقائية (10 → إخفاء، 30 → حظر).
