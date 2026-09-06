# أنماط التصميم المستخدمة — Nilotic Frost ERP

## الأنماط الموجودة فعلاً في الكود

---

### 1. Singleton State Pattern (نمط الحالة الموحدة)

**الموقع:** `js/state.js`

```javascript
window.ERPState = {
  load() { ... },
  save(state) { ... },
  // ...
};
```

**الوصف:**
- كائن واحد عالمي `window.ERPState` يُوفَّر لكل الصفحات
- كل صفحة تستدعي `ERPState.load()` للحصول على الحالة الكاملة
- التعديلات تمر عبر `ERPState.save(state)` لضمان المركزية

**لماذا هذا النمط؟**
في غياب Backend، هذا يضمن أن كل الصفحات تعمل على نفس "مصدر الحقيقة الواحد" (Single Source of Truth).

---

### 2. Service Layer Pattern (طبقة الخدمات)

**الموقع:** دوال في `state.js`

```javascript
ERPState.addRawMaterialArrival(data)  // Raw Material Service
ERPState.createProcessingOperation(data)  // Processing Service
ERPState.createShipment(data)         // Shipment Service
ERPState.addFinancialTransaction(data) // Financial Service
```

**الوصف:**
- كل عملية تجارية مُجمَّعة في دالة واحدة تُنفّذ كل آثارها
- الـ Views (HTML) لا تتعامل مع بيانات الحالة مباشرة

**مثال:**
```javascript
// بدلاً من أن تعدّل الصفحة المخزون مباشرة:
// ❌ state.rawBatches[0].availableQty -= 2000;

// الصفحة تستدعي الخدمة:
// ✅ ERPState.addRawMaterialArrival({ supplierName, qty, ... });
// والخدمة هي المسؤولة عن: إنشاء اللوط + القيد المالي + الحفظ
```

---

### 3. Template Method Pattern (نمط القالب الإجرائي)

**الموقع:** كل دوال الـ Service Layer

**الوصف:**
كل service method تتبع نفس الهيكل:
```
1. load() — تحميل الحالة
2. التحقق من الصحة (إذا لزم)
3. تنفيذ التغيير الرئيسي
4. الآثار الجانبية التلقائية (قيود مالية، تحديث أرصدة)
5. save(state) — حفظ الحالة
6. إعادة رسالة النتيجة
```

---

### 4. Observer/Event-Driven Pattern (نمط الأحداث)

**الموقع:** `navigation.js` + `interactions.js`

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // يُنفَّذ عندما يكتمل تحميل HTML
  // يبني الـ sidebar، يُفعّل الأحداث...
});
```

**الوصف:**
- الـ navigation engine يستجيب لحدث `DOMContentLoaded`
- كل أزرار الـ toast تستجيب لحدث `click`
- البحث يستجيب لحدث `keydown` (Enter)

---

### 5. Factory Pattern (نمط المصنع) — للـ IDs

**الموقع:** `state.js`

```javascript
// كل service تُولّد ID آلي:
const batchId = `LOT-RAW-${dateStr.replace(/-/g, '')}-${String(count).padStart(2, '0')}`;
const opId    = `PR-2026-${String(opCount).padStart(3, '0')}`;
const txnId   = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
```

**الوصف:**
قاعدة ثابتة لتوليد معرّفات فريدة لكل كيان.

---

### 6. Decorator Pattern (نمط الزخرفة) — للمصادقة

**الموقع:** `state.js` → `ERPState.can(action)`

```javascript
can(action) {
  const user = this.getCurrentUser();
  if (user.role === "Admin") return true;
  if (user.role === "Supervisor") return action !== "DELETE_OPERATION";
  if (user.role === "Operator")   return action === "CREATE_OPERATION";
  // ...
}
```

**كيف تُستخدم:**
```javascript
// في الصفحة:
if (!ERPState.can("CREATE_OPERATION")) {
  btn.disabled = true;
  btn.title = "لا تملك صلاحية هذا الإجراء";
}
```

---

### 7. Active Record-like Pattern (نمط السجل النشط)

**الموقع:** `state.js` — التعديل المباشر على الكائنات

```javascript
const batch = state.rawBatches.find(b => b.batchId === id);
batch.availableQty -= usedQty;  // تعديل مباشر على الكائن المرجعي
this.save(state);
```

**الوصف:**
بدلاً من إنشاء كائنات جديدة، يجد الكائن المطلوب ويعدّله مباشرة في الذاكرة ثم يحفظ.

---

### 8. Breadcrumb Navigation Pattern

**الموقع:** `navigation.js` → `pageTitleMap`

```javascript
const pageTitleMap = {
  'processing-operations.html': 'عمليات التدوير والإنتاج',
  'shipment-create.html': 'إنشاء شحنة تصدير جديدة',
  // ...
};
```

**الوصف:**
الصفحة الحالية تُكتشف تلقائياً من URL وعنوانها يُعرض في الـ header.

---

### 9. Default Value Pattern (قيم افتراضية ذكية)

**الموقع:** جميع service methods

```javascript
const unitPrice = parseFloat(orderData.unitPriceEur) || 
                  (customer ? customer.agreedProducts[0]?.targetPriceEur : 1.85);
const fxRate = parseFloat(orderData.fxRate) || 53.20;
const contractor = state.contractors.find(c => c.station === station);
const contractorRate = contractor ? contractor.tariffRatePerKg : 2.00;
```

**الوصف:**
كل حقل له قيمة افتراضية منطقية في حالة عدم الإدخال، تُستمَد من السياق (العميل، المحطة، المقاول) أو قيمة ثابتة.

---

### 10. Audit Trail Pattern (نمط سجل التدقيق)

**الموقع:** `operations[]` و `shipments[]` في الحالة

```javascript
audit: [
  {
    at: "2026-08-21 08:00",
    by: "محمود حسن (Operator)",
    action: "CREATE",
    summary: "إنشاء واقعة التشغيل وسحب 6,000 كجم خام"
  },
  {
    at: "2026-08-21 12:00",
    by: "محمد إبراهيم (Supervisor)",
    action: "LOCK",
    summary: "اعتماد التشغيلة وترحيل الباتش"
  }
]
```

**الوصف:**
كل عملية وشحنة تحتفظ بسجل تاريخي كامل للإجراءات مع اسم المستخدم والوقت والوصف.

---

## الأنماط المعيارية المفقودة (للتنبيه عند التطوير)

| النمط | سبب غيابه | التوصية |
|------|----------|---------|
| **Repository Pattern** | لا قاعدة بيانات | يجب تطبيقه مع Backend |
| **Command Pattern** | لا undo/redo | مفيد لعكس العمليات |
| **Error Boundary** | لا معالجة أخطاء منظمة | يجب إضافة try/catch شامل |
| **Cache-Aside** | localStorage = دائماً متزامن | سيحتاجه مع API |
