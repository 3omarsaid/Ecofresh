# البرومبتات ونماذج الذكاء الاصطناعي المقترحة (Prompts & Model Specs)

> **إشعار للمطور المنفّذ (Implementation Note):**
> هذا الملف يوفر صياغات البرومبتات وهياكل الـ JSON الصارمة ونماذج الـ LLM الموصى بها لتنفيذ الـ Route Handlers المذكورة في [`08-ai/ai-features-overview.md`](file:///e:/web/exporting_erp/docs/08-ai/ai-features-overview.md).

---

## 1. مصفوفة النماذج الموصى بها وموازنة التكلفة (Model Selection Matrix)

| المهمة الذكية | النموذج الموصى به الأول | النموذج البديل (منخفض التكلفة) | نوع الدخل | نوع المخرج المتوقع | زمن الاستجابة المقبول |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **استخراج كروت ميزان البسكول** | Gemini 1.5 Flash | GPT-4o-mini | صورة/PDF | JSON صارم (Strict Schema) | < 3 ثوانٍ |
| **فحص الجودة البصري للعينات** | Claude 3.5 Sonnet | Gemini 1.5 Pro | 2-4 صور | JSON + شرح تحليلي بالعربية | < 5 ثوانٍ |
| **التنبؤ بنسب الهالك والتصافي** | Gemini 1.5 Flash | Mistral Small | نصوص وأرقام JSON | JSON مع نسبة مئوية ومستوى ثقة | < 2 ثانية |
| **المساعد المالي والتحليلي (Copilot)** | Claude 3.5 Sonnet | GPT-4o | نصوص باللغة الطبيعية | Markdown + SQL Parameterized Query | < 3 ثوانٍ |

---

## 2. البرومبتات وهياكل الاستجابة (Detailed Prompt Contracts)

### الموديول 1: استخراج تذكرة الميزان البسكول (Weighbridge OCR Prompt)
**المسار في Next.js:** `app/api/ai/parse-ticket/route.ts`  
**طريقة الاستدعاء:** `POST` مع `multipart/form-data` (صورة التذكرة).

#### الـ System Prompt:
```text
You are an expert Arabic OCR document parser specialized in Egyptian agricultural weighing tickets (تذاكر ميزان البسكول) for frozen food export companies.
Your job is to accurately extract numerical and text values from the provided ticket image.

STRICT INSTRUCTIONS:
1. Extract the vehicle gross weight (الوزن القائم) in kilograms.
2. Extract the vehicle tare/empty weight (الوزن الفارغ) in kilograms.
3. Extract or verify net weight: Net = Gross - Tare.
4. Extract the Egyptian vehicle license plate number (رقم لوحة السيارة/أرقام وحروف).
5. Extract the date of weighing (تاريخ الوزن) in YYYY-MM-DD format.
6. Extract supplier or farm name if printed, otherwise null.
7. Return ONLY a valid, raw JSON object conforming strictly to the schema provided. Do not include markdown codeblocks or greetings.
```

#### الـ Response JSON Schema:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "grossQtyKg": { "type": "number", "description": "الوزن القائم بالكيلوجرام" },
    "tareQtyKg": { "type": "number", "description": "الوزن الفارغ بالكيلوجرام" },
    "netQtyKg": { "type": "number", "description": "الوزن الصافي بالكيلوجرام" },
    "truckPlate": { "type": "string", "description": "رقم لوحة السيارة باللغة العربية" },
    "weighingDate": { "type": "string", "format": "date", "description": "YYYY-MM-DD" },
    "ticketNumber": { "type": "string", "description": "رقم التذكرة التسلسلي" },
    "confidenceScore": { "type": "number", "minimum": 0, "maximum": 1, "description": "مستوى الثقة في الاستخراج" }
  },
  "required": ["grossQtyKg", "tareQtyKg", "netQtyKg", "weighingDate"],
  "additionalProperties": false
}
```

---

### الموديول 2: فحص العينات وجودة المحصول (Quality Inspection Vision Prompt)
**المسار في Next.js:** `app/api/ai/inspect-quality/route.ts`  
**طريقة الاستدعاء:** `POST` مع روابط صور العينة المخزنة في Supabase Storage.

#### الـ System Prompt:
```text
You are a Senior Agricultural Quality Control Inspector (مفتش جودة أغذية وتجميد) specializing in export-grade frozen strawberries (فراولة مجمدة IQF) and mangoes (مانجو مكعبات).
Analyze the attached fruit sample images and assess conformity with European export standards (Grade 1 / ممتاز).

EVALUATE:
1. Color uniformity and maturity index (نسبة النضج واللون الأحمر المتجانس).
2. Physical defects: green tips (أعناق خضراء), bruises (كدمات), fungal spots (عفن), mechanical cuts (جروح ميكانيكية).
3. Estimated defects percentage (% العيوب الظاهرية).
4. Estimated Brix level consistency range.
5. Recommendation: APPROVE for IQF, DOWNGRADE to Puree/Juice (توجيه تصنيع عصير), or REJECT (رفض تام).

Provide the output strictly in Arabic in the specified JSON structure.
```

#### الـ Response JSON Schema:
```json
{
  "inspectionResult": {
    "defectPercentage": 4.5,
    "maturityLevel": "كامل النضج وتجانس لوني 95%",
    "detectedIssues": [
      "وجود 2% حبات بها طرف أبيض غير مكتمل التلوين",
      "خلو تام من العفن أو الإصابات الحشرية"
    ],
    "estimatedBrixRange": "8.0 - 9.0 Brix",
    "recommendedQcStatus": "APPROVED",
    "recommendedAction": "صالح للتجميد السريع التصديري IQF Grade A",
    "rejectionRisk": "LOW"
  }
}
```

---

### الموديول 3: التنبؤ بمعدلات الإنتاجية والتصافي (Predictive Yield Forecaster Prompt)
**المسار في Next.js:** `app/api/ai/predict-yield/route.ts`

#### الـ System Prompt:
```text
You are an Industrial Food Processing Optimization Engine for IQF freezing plants.
Given the supplier's raw lot parameters, historical batch yields, and ambient temperature/harvest timing, calculate the expected finished output, waste ratio, and total processing cost per kg.

FORMULAS TO RESPECT:
- Yield % = (Finished Output / Raw Input) * 100
- Raw Waste % = 100 - Yield % - Secondary Output %
- Contractor Cost = Finished Output * Contractor Tariff Rate
```

#### نموذج الدخل (Input Payload):
```json
{
  "rawProduct": "فراولة",
  "supplierName": "مزارع الوادي الحديثة",
  "rawInputKg": 6000,
  "brixDegree": 8.5,
  "station": "محطة النخيل",
  "contractorTariffRate": 2.00,
  "historicalAvgYield": 79.5
}
```

#### نموذج المخرج (Output JSON):
```json
{
  "predictedYieldPercent": 80.2,
  "predictedFinishedOutputKg": 4812,
  "predictedWasteKg": 888,
  "expectedCostPerKg": 31.45,
  "confidenceScore": 0.92,
  "keyAdvice": "الخام ممتاز والبريكس ملائم جداً؛ يُوصى بضبط سرعة نفق التجميد على 12 دقيقة لتقليل الفاقد التبخيري."
}
```

---

### الموديول 4: مساعد التقارير والقرارات التصديرية (ERP Natural Language Copilot)
**المسار في Next.js:** `app/api/ai/copilot/route.ts`

#### الـ System Prompt:
```text
أنت المساعد المالي والتشغيلي الذكي لنظام Nilotic Frost ERP.
مهمتك: مساعدة الإدارة العليا في قراءة مؤشرات الأرباح والمخزون ومتابعة الموردين والعملاء.

قواعد صارمة:
1. اعتمد فقط على سياق البيانات المحاسبية المقدم لك (Schema والـ Views الخاصة بـ Supabase).
2. لا تقم أبداً بتأليف أي أرقام أو أرصدة خارج الداتا.
3. اشرح دائماً بالجنيه المصري (EGP) واليورو (EUR) حسب نوع المعاملة.
4. اربط دائماً بين أداء الشحنات وهوامش الربح الصافية (Net Profit Margin %).
5. أسلوب الإجابة: مهني، مباشر، مدعوم بأرقام محددة وتوصيات تنفيذية.
```

---

## 3. مثال تنفيذي لكود Next.js Route Handler باستدعاء النموذج

```ts
// app/api/ai/parse-ticket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { can, getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // 1. التحقق الأمني والصلاحيات
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return NextResponse.json({ success: false, error: 'غير مصرح لك بهذا الإجراء' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('file') as File;
    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'يجب إرفاق ملف تذكرة الميزان' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // 2. استدعاء نموذج الرؤية (Gemini 1.5 Flash كمثال موفر للتكلفة)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract weighbridge ticket data in strict JSON: { grossQtyKg, tareQtyKg, netQtyKg, truckPlate, weighingDate }" },
            { inline_data: { mime_type: imageFile.type, data: base64Image } }
          ]
        }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const aiData = await response.json();
    const parsedTicket = JSON.parse(aiData.candidates[0].content.parts[0].text);

    return NextResponse.json({
      success: true,
      extractedData: parsedTicket,
      message: 'تم استخراج بيانات تذكرة الوزن بنجاح'
    });

  } catch (error: any) {
    console.error('AI OCR Parse Error:', error);
    return NextResponse.json({
      success: false,
      error: 'تعذر استخراج بيانات التذكرة آلياً، يرجى إدخال البيانات يدوياً'
    }, { status: 500 });
  }
}
```
