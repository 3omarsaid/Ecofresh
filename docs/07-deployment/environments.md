# البيئات المختلفة — Nilotic Frost ERP

## البيئات المقترحة

| البيئة | الغرض | الـ URL |
|-------|-------|-------|
| **Development** | تطوير محلي | localhost:3000 |
| **Staging** | اختبار قبل الإنتاج | staging.niloticfrost.com |
| **Production** | البيئة الحية | app.niloticfrost.com |

---

## الوضع الحالي

| البيئة | الحالة |
|-------|-------|
| Development | ✅ يعمل — فتح مباشر بالمتصفح |
| Staging | ❌ غير مُعدَّة (لا backend) |
| Production | ❌ غير مُعدَّة (لا backend) |

---

## الفروق بين البيئات

| الإعداد | Development | Staging | Production |
|--------|------------|---------|-----------|
| Debug mode | ON | OFF | OFF |
| Log level | DEBUG | INFO | WARN |
| DB | local | staging DB | prod DB |
| Cache | OFF | ON | ON |
| Backups | لا | يومي | يومي + أسبوعي |
| SSL | لا | نعم | نعم |
| Rate limiting | لا | نعم | نعم |
