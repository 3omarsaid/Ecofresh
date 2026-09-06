# الإعداد المحلي للمشروع — Nilotic Frost ERP

## المتطلبات الأساسية

لتشغيل البروتوتايب **لا تحتاج لأي شيء** سوى:
- متصفح حديث (Chrome / Firefox / Edge / Safari)
- محرر نصوص (VSCode موصى به)

---

## خطوات تشغيل البروتوتايب

### الطريقة 1: فتح مباشر (الأسهل)

```bash
# افتح الملف مباشرة في المتصفح
file:///e:/web/exporting_erp/base_prototype/index.html
```

أو انقر نقراً مزدوجاً على `index.html` في مجلد `base_prototype`.

---

### الطريقة 2: Live Server (لتجنب مشاكل CORS)

```bash
# 1. ثبّت VSCode
# 2. ثبّت امتداد "Live Server" من Ritwick Dey
# 3. افتح مجلد base_prototype في VSCode
# 4. انقر على "Go Live" في شريط الحالة
# 5. افتح http://localhost:5500 في المتصفح
```

---

### الطريقة 3: Python Simple Server

```bash
cd e:/web/exporting_erp/base_prototype
python -m http.server 8080
# افتح http://localhost:8080
```

---

### الطريقة 4: Node.js HTTP Server

```bash
npm install -g http-server
cd e:/web/exporting_erp/base_prototype
http-server -p 8080
```

---

## هيكل الملفات الذي يجب أن يظل سليماً

```
base_prototype/
├── index.html              ← نقطة الدخول الرئيسية
├── pages/
│   └── *.html              ← جميع الصفحات (59 ملف)
├── js/
│   ├── state.js            ← MUST يُحمَّل أولاً
│   ├── navigation.js
│   ├── interactions.js
│   └── app.js
└── css/
    ├── global.css
    └── custom.css
```

---

## إعادة ضبط البيانات

البيانات مخزّنة في `localStorage`. لإعادة ضبطها:

**الطريقة 1: من الكود**
```javascript
// في console المتصفح:
ERPState.reset();
location.reload();
```

**الطريقة 2: من DevTools**
```
F12 → Application → Local Storage → localhost → حذف NILOTIC_ERP_STATE
```

**الطريقة 3: زر في الواجهة**
- في شاشة **عمليات التشغيل** يوجد زر 🔄 لإعادة الضبط

---

## استكشاف بيانات الحالة

```javascript
// في console المتصفح:
const state = ERPState.load();
console.log(state);
// يعرض كل البيانات: customers, suppliers, operations, shipments, ...

// مثال: عرض عمليات الإنتاج
state.operations.forEach(op => console.log(op.id, op.finishedOutputKg, 'كجم'));

// مثال: فحص رصيد الخام
state.rawBatches.forEach(b => console.log(b.batchId, b.availableQty));
```

---

## التحقق من سلامة التصفح

الـ navigation موحّد عبر `navigation.js` — أي صفحة تُفتح مستقلة تُولّد sidebar + header تلقائياً.

للتحقق:
1. افتح أي صفحة من `pages/*.html` مباشرة
2. يجب أن تظهر القائمة الجانبية بشكل صحيح
3. يجب أن يكون الرابط الحالي مُظلَّلاً بلون أخضر داكن

---

## ملاحظات مهمة للمطورين

| ملاحظة | التفاصيل |
|-------|---------|
| **state.js يجب أن يُحمَّل أولاً** | `<script src="state.js">` بدون `defer` |
| **لا يعمل عبر `file://` في Chrome أحياناً** | استخدم Live Server |
| **البيانات تختلف بين تبويبات المتصفح** | نفس المتصفح = نفس localStorage |
| **المتصفح Private mode** | يُفقد البيانات عند الإغلاق |
| **Safari يقيّد localStorage** | قد تحتاج تفعيل localStorage في الإعدادات |
