/**
 * Nilotic Frost ERP — Unified Core State, RBAC, Financials & Traceability Engine
 * Storage Key: NILOTIC_ERP_STATE
 */
const ERP_STORAGE_KEY = "NILOTIC_ERP_STATE";

const DEFAULT_USERS = [
  { id: "usr-01", name: "م. أحمد محمود", role: "Admin", title: "مدير النظام والعمليات", avatar: "👑" },
  { id: "usr-02", name: "محمد إبراهيم", role: "Supervisor", title: "مشرف عام المحطة والجودة", avatar: "🛡️" },
  { id: "usr-03", name: "محمود حسن", role: "Operator", title: "مشغل خط الإنتاج والفرز", avatar: "⚙️" },
  { id: "usr-04", name: "سامح عادل", role: "Storekeeper", title: "أمين مخزن الخام والمستلزمات", avatar: "📦" },
  { id: "usr-05", name: "خالد سعيد", role: "Viewer", title: "مراقب / مدقق خارجي (قراءة فقط)", avatar: "👁️" }
];

const INITIAL_ERP_SCHEMA = {
  version: 3,
  users: DEFAULT_USERS,
  currentUser: DEFAULT_USERS[0],

  // MASTER DATA: CUSTOMERS
  customers: [
    {
      id: "CUST-001",
      code: "CUST-SAMA-NL",
      name: "شركة سما للتجارة والتصدير (هولندا)",
      country: "هولندا",
      destinationPort: "ميناء روتردام",
      currency: "EUR",
      paymentTerms: "30 يوم بعد بوليصة الشحن",
      creditLimit: 500000,
      contactPerson: "السيد / يوهان فان دير مير",
      phone: "+31 20 555 1234",
      email: "orders@sama-export.nl",
      status: "نشط",
      agreedProducts: [
        { productName: "فراولة مجمدة IQF", targetPriceEur: 1.85, packagingSpec: "كرتونة 10 كجم (5 طبقات)" },
        { productName: "مانجو مكعبات مجمدة", targetPriceEur: 2.40, packagingSpec: "كرتونة 10 كجم" }
      ]
    },
    {
      id: "CUST-002",
      code: "CUST-ALNOOR-SA",
      name: "مؤسسة النور للتوزيع والتوريدات (السعودية)",
      country: "السعودية",
      destinationPort: "ميناء جدة الإسلامي",
      currency: "USD",
      paymentTerms: "50% مقدم و50% عند الاستلام",
      creditLimit: 750000,
      contactPerson: "الشيخ / عبد العزيز الشمري",
      phone: "+966 12 666 7890",
      email: "procurement@alnoor-food.sa",
      status: "نشط",
      agreedProducts: [
        { productName: "بامية ممتازة مجمدة", targetPriceEur: 2.10, packagingSpec: "كرتونة 8 كجم (أكياس 400 جم)" },
        { productName: "فراولة مجمدة IQF", targetPriceEur: 1.90, packagingSpec: "كرتونة 10 كجم" }
      ]
    },
    {
      id: "CUST-003",
      code: "CUST-EUROFROST-DE",
      name: "شركة يوروفروست للأغذية (ألمانيا)",
      country: "ألمانيا",
      destinationPort: "ميناء هامبورغ",
      currency: "EUR",
      paymentTerms: "اعتماد مستندي LC",
      creditLimit: 1200000,
      contactPerson: "Dr. Klaus Weber",
      phone: "+49 40 789 4561",
      email: "import@eurofrost.de",
      status: "نشط",
      agreedProducts: [
        { productName: "فراولة شرائح مجمدة", targetPriceEur: 1.95, packagingSpec: "كرتونة 10 كجم" },
        { productName: "مانجو شرائح مجمدة", targetPriceEur: 2.60, packagingSpec: "كرتونة 10 كجم" }
      ]
    }
  ],

  // MASTER DATA: SUPPLIERS
  suppliers: [
    { id: "SUPP-001", code: "SUPP-WADI", name: "مزارع الوادي الحديثة", type: "مورد خام زراعي", product: "فراولة خام", phone: "01001234567", location: "البحيرة - مركز بدر", status: "معتمد" },
    { id: "SUPP-002", code: "SUPP-KHAIR", name: "شركة الخير للتنمية الزراعية", type: "مورد خام زراعي", product: "فراولة خام", phone: "01123456789", location: "الإسماعيلية - القصاصين", status: "معتمد" },
    { id: "SUPP-003", code: "SUPP-ISMAILIA", name: "مزارع الإسماعيلية النموذجية", type: "مورد خام زراعي", product: "مانجو خام", phone: "01234567890", location: "الإسماعيلية", status: "معتمد" },
    { id: "SUPP-004", code: "SUPP-DELTA", name: "شركة الدلتا الزراعية", type: "مورد خام زراعي", product: "مانجو خام", phone: "01099887766", location: "الشرقية - الصالحية", status: "معتمد" },
    { id: "SUPP-005", code: "SUPP-SAEED", name: "جمعية الصعيد للتنمية الزراعية", type: "مورد خام زراعي", product: "بامية خام", phone: "01155443322", location: "المنيا - سمالوط", status: "معتمد" },
    { id: "SUPP-006", code: "SUPP-NILE-TRD", name: "شركة النيل للزراعات والتجميد", type: "مورد بضاعة جاهزة (صفقات)", product: "فراولة مجمدة IQF", phone: "01022334455", location: "مدينة السادات", status: "معتمد" },
    { id: "SUPP-007", code: "SUPP-DLT-TRD", name: "مصنع الدلتا للأغذية المحفوظة", type: "مورد بضاعة جاهزة (صفقات)", product: "بامية ممتازة مجمدة", phone: "01244556677", location: "طنطا", status: "معتمد" },
    { id: "SUPP-008", code: "SUPP-EGYPT-CARTON", name: "الشركة المصرية للكرتون ومواد التعبئة", type: "مورد مستلزمات وكراتين", product: "كراتين تصدير", phone: "01511223344", location: "مدينة العاشر من رمضان", status: "معتمد" }
  ],

  // MASTER DATA: CONTRACTORS
  contractors: [
    { id: "CONT-001", name: "مقاول أحمد للتجهيز", tariffRatePerKg: 2.00, phone: "01098765432", station: "محطة النخيل", specialization: "فرز وتجهيز وتجميد الفراولة", status: "نشط" },
    { id: "CONT-002", name: "مقاول محمد للفرز", tariffRatePerKg: 2.00, phone: "01187654321", station: "محطة السلام", specialization: "تقشير وتقطيع المانجو", status: "نشط" },
    { id: "CONT-003", name: "مؤسسة التيسير للعمالة", tariffRatePerKg: 2.20, phone: "01276543210", station: "محطة المدينة", specialization: "تقميع وتجهيز الخضار", status: "نشط" }
  ],

  // MASTER DATA: STATIONS & COLD STORES
  stations: [
    { id: "STN-01", name: "محطة النخيل", location: "البحيرة - مركز بدر", coldStorageCapacityKg: 250000, electricityRatePerKg: 2.50, supervisor: "محمد إبراهيم" },
    { id: "STN-02", name: "محطة السلام", location: "الإسماعيلية - المنطقة الصناعية", coldStorageCapacityKg: 300000, electricityRatePerKg: 2.75, supervisor: "سامح عادل" },
    { id: "STN-03", name: "محطة المدينة", location: "مدينة السادات - المنوفية", coldStorageCapacityKg: 200000, electricityRatePerKg: 2.40, supervisor: "م. أحمد محمود" }
  ],

  // MASTER DATA: PACKAGING & INDUSTRIAL SUPPLIES
  supplies: [
    { id: "SUP-01", code: "CTN-EXP-10K", name: "كرتونة تصدير 10 كجم (5 طبقات)", category: "كرتونة", capacityKg: 10, unit: "كرتونة", stock: 2020, unitPrice: 18.00 },
    { id: "SUP-02", code: "BAG-POLY-01K", name: "أكياس بولي إيثيلين غذائي 1 كجم", category: "أكياس", capacityKg: 1, unit: "كيس", stock: 10200, unitPrice: 1.20 },
    { id: "SUP-03", code: "PLT-WOOD-EXP", name: "بالتات خشبية معالجة حرارياً (تصدير)", category: "بالتات", capacityKg: 1000, unit: "بالتة", stock: 120, unitPrice: 220.00 },
    { id: "SUP-04", code: "TPE-IND-100M", name: "شريط لاصق شفاف صناعي 100م", category: "لاصق", capacityKg: 0, unit: "بكرة", stock: 450, unitPrice: 35.00 },
    { id: "SUP-05", code: "STR-FLM-23MC", name: "استريتش فيلم صناعي 23 ميكرون", category: "تغليف", capacityKg: 0, unit: "رول", stock: 80, unitPrice: 380.00 },
    { id: "SUP-06", code: "CTN-EXP-08K", name: "كرتونة تصدير 8 كجم (خضار مشكل)", category: "كرتونة", capacityKg: 8, unit: "كرتونة", stock: 1500, unitPrice: 16.50 }
  ],

  // MASTER DATA: PRODUCTS
  products: [
    { id: "PRD-01", name: "فراولة مجمدة IQF", code: "FG-STR-IQF", category: "فواكه مجمدة", defaultUnit: "KG", standardWastePct: 20.0, standardYieldPct: 80.0 },
    { id: "PRD-02", name: "فراولة شرائح مجمدة", code: "FG-STR-SLI", category: "فواكه مجمدة", defaultUnit: "KG", standardWastePct: 22.0, standardYieldPct: 78.0 },
    { id: "PRD-03", name: "مانجو مكعبات مجمدة", code: "FG-MNG-CUB", category: "فواكه مجمدة", defaultUnit: "KG", standardWastePct: 28.0, standardYieldPct: 72.0 },
    { id: "PRD-04", name: "بامية ممتازة مجمدة", code: "FG-OKRA-EXT", category: "خضار مجمد", defaultUnit: "KG", standardWastePct: 15.0, standardYieldPct: 85.0 }
  ],

  // RAW MATERIAL WAREHOUSE LOTS (LOT-RAW)
  rawBatches: [
    { batchId: "LOT-RAW-001", station: "محطة النخيل", rawProduct: "فراولة", supplierName: "مزارع الوادي الحديثة", initialQty: 8000, availableQty: 4000, unitCost: 18.50, receivedDate: "2026-08-15", qcStatus: "APPROVED", brixDegree: 8.5, truckPlate: "أ ب ج 1234" },
    { batchId: "LOT-RAW-002", station: "محطة النخيل", rawProduct: "فراولة", supplierName: "شركة الخير للتنمية الزراعية", initialQty: 5000, availableQty: 3000, unitCost: 19.20, receivedDate: "2026-08-18", qcStatus: "APPROVED", brixDegree: 9.0, truckPlate: "د هـ و 5678" },
    { batchId: "LOT-RAW-003", station: "محطة النخيل", rawProduct: "فراولة", supplierName: "مزارع الوادي الحديثة", initialQty: 6000, availableQty: 6000, unitCost: 17.80, receivedDate: "2026-08-20", qcStatus: "APPROVED", brixDegree: 8.2, truckPlate: "س ص ع 9012" },
    { batchId: "LOT-RAW-004", station: "محطة السلام", rawProduct: "مانجو", supplierName: "مزارع الإسماعيلية النموذجية", initialQty: 10000, availableQty: 5000, unitCost: 28.00, receivedDate: "2026-08-10", qcStatus: "APPROVED", brixDegree: 14.5, truckPlate: "ف ق ك 3456" },
    { batchId: "LOT-RAW-005", station: "محطة السلام", rawProduct: "مانجو", supplierName: "شركة الدلتا الزراعية", initialQty: 7500, availableQty: 7500, unitCost: 26.50, receivedDate: "2026-08-14", qcStatus: "APPROVED", brixDegree: 15.0, truckPlate: "ل م ن 7890" },
    { batchId: "LOT-RAW-006", station: "محطة المدينة", rawProduct: "بامية", supplierName: "جمعية الصعيد للتنمية الزراعية", initialQty: 4000, availableQty: 4000, unitCost: 22.00, receivedDate: "2026-08-16", qcStatus: "APPROVED", brixDegree: 0, truckPlate: "هـ و ي 1122" }
  ],

  // PROCESSING OPERATIONS (PR-XXXX)
  operations: [
    {
      id: "PR-2026-001",
      date: "2026-08-21",
      station: "محطة النخيل",
      rawProduct: "فراولة",
      finishedProduct: "فراولة مجمدة IQF",
      contractor: "مقاول أحمد للتجهيز",
      locked: true,
      rawIssues: [
        { batchId: "LOT-RAW-001", supplierName: "مزارع الوادي الحديثة", qty: 4000, unitCost: 18.50, totalCost: 74000 },
        { batchId: "LOT-RAW-002", supplierName: "شركة الخير للتنمية الزراعية", qty: 2000, unitCost: 19.20, totalCost: 38400 }
      ],
      suppliesIssues: [
        { supplyId: "SUP-01", name: "كرتونة تصدير 10 كجم (5 طبقات)", consumed: 480, waste: 20, withdrawn: 500, unitCost: 18.00, consumedCost: 8640, wasteCost: 360 },
        { supplyId: "SUP-02", name: "أكياس بولي إيثيلين غذائي 1 كجم", consumed: 4800, waste: 200, withdrawn: 5000, unitCost: 1.20, consumedCost: 5760, wasteCost: 240 }
      ],
      rawInputKg: 6000,
      finishedOutputKg: 4800,
      secondaryOutputKg: 300,
      rawWasteKg: 900,
      yieldPercent: 80.0,
      costs: {
        rawCost: 112400,
        suppliesConsumedCost: 14400,
        suppliesWasteCost: 600,
        contractorCost: 9600,
        stationCost: 12000,
        otherCost: 2500
      },
      grandTotalCost: 151500,
      costPerKg: 31.56,
      generatedBatchId: "FG-PR-2026-001",
      notes: "تشغيل ممتاز، فرز درجة أولى مطابق للمواصفات التصديرية",
      audit: [
        { at: "2026-08-21 08:00", by: "محمود حسن (Operator)", action: "CREATE", summary: "إنشاء وتوثيق واقعة التشغيل وسحب 6,000 كجم خام" },
        { at: "2026-08-21 12:00", by: "محمد إبراهيم (Supervisor)", action: "LOCK", summary: "اعتماد التشغيلة وترحيل وتوليد باتش الجاهز FG-PR-2026-001" }
      ]
    },
    {
      id: "PR-2026-002",
      date: "2026-08-22",
      station: "محطة السلام",
      rawProduct: "مانجو",
      finishedProduct: "مانجو مكعبات مجمدة",
      contractor: "مقاول محمد للفرز",
      locked: true,
      rawIssues: [
        { batchId: "LOT-RAW-004", supplierName: "مزارع الإسماعيلية النموذجية", qty: 5000, unitCost: 28.00, totalCost: 140000 }
      ],
      suppliesIssues: [
        { supplyId: "SUP-01", name: "كرتونة تصدير 10 كجم (5 طبقات)", consumed: 360, waste: 10, withdrawn: 370, unitCost: 18.00, consumedCost: 6480, wasteCost: 180 }
      ],
      rawInputKg: 5000,
      finishedOutputKg: 3600,
      secondaryOutputKg: 200,
      rawWasteKg: 1200,
      yieldPercent: 72.0,
      costs: {
        rawCost: 140000,
        suppliesConsumedCost: 6480,
        suppliesWasteCost: 180,
        contractorCost: 7200,
        stationCost: 10000,
        otherCost: 1800
      },
      grandTotalCost: 165660,
      costPerKg: 46.02,
      generatedBatchId: "FG-PR-2026-002",
      notes: "تقشير وتقطيع مكعبات 20x20 ملم",
      audit: [
        { at: "2026-08-22 09:30", by: "م. أحمد محمود (Admin)", action: "CREATE_AND_LOCK", summary: "توثيق واعتماد عملية إنتاج مانجو مكعبات" }
      ]
    }
  ],

  // FINISHED GOODS BATCHES (FG-PR / FG-DIR)
  finishedGoodsBatches: [
    {
      fgBatchId: "FG-PR-2026-001",
      sourceType: "MANUFACTURED",
      sourceOpId: "PR-2026-001",
      station: "محطة النخيل",
      productName: "فراولة مجمدة IQF",
      productionDate: "2026-08-21",
      initialQty: 4800,
      availableQty: 4800,
      costPerKg: 31.56,
      totalValue: 151500,
      rawSources: [
        { batchId: "LOT-RAW-001", supplierName: "مزارع الوادي الحديثة", qty: 4000, unitCost: 18.50 },
        { batchId: "LOT-RAW-002", supplierName: "شركة الخير للتنمية الزراعية", qty: 2000, unitCost: 19.20 }
      ],
      suppliersSummary: [
        { supplierName: "مزارع الوادي الحديثة", sharePct: 66.7 },
        { supplierName: "شركة الخير للتنمية الزراعية", sharePct: 33.3 }
      ]
    },
    {
      fgBatchId: "FG-PR-2026-002",
      sourceType: "MANUFACTURED",
      sourceOpId: "PR-2026-002",
      station: "محطة السلام",
      productName: "مانجو مكعبات مجمدة",
      productionDate: "2026-08-22",
      initialQty: 3600,
      availableQty: 3600,
      costPerKg: 46.02,
      totalValue: 165660,
      rawSources: [
        { batchId: "LOT-RAW-004", supplierName: "مزارع الإسماعيلية النموذجية", qty: 5000, unitCost: 28.00 }
      ],
      suppliersSummary: [
        { supplierName: "مزارع الإسماعيلية النموذجية", sharePct: 100.0 }
      ]
    },
    {
      fgBatchId: "FG-DIR-2026-001",
      sourceType: "DIRECT_PURCHASE",
      dealRef: "DEAL-2026-001",
      supplierName: "شركة النيل للزراعات والتجميد",
      station: "محطة النخيل",
      productName: "فراولة مجمدة IQF",
      packageType: "كرتونة 10 كجم (5 طبقات)",
      packageCount: 500,
      productionDate: "2026-08-23",
      expiryDate: "2028-02-23",
      initialQty: 5000,
      availableQty: 5000,
      purchasePricePerKg: 32.00,
      extraExpenses: 1500,
      costPerKg: 32.30,
      totalValue: 161500,
      qualityStatus: "مطابق للمواصفات التصديرية (درجة أولى)",
      notes: "صفقة بضاعة جاهزة واردة مباشرة من مصنع النيل معبأة في كراتين تصدير 10 كجم بدون تدوير داخلي",
      rawSources: [],
      suppliersSummary: [
        { supplierName: "شركة النيل للزراعات والتجميد", sharePct: 100.0 }
      ]
    },
    {
      fgBatchId: "FG-DIR-2026-002",
      sourceType: "DIRECT_PURCHASE",
      dealRef: "DEAL-2026-002",
      supplierName: "مصنع الدلتا للأغذية المحفوظة",
      station: "محطة السلام",
      productName: "بامية ممتازة مجمدة",
      packageType: "كرتونة 8 كجم",
      packageCount: 375,
      productionDate: "2026-08-24",
      expiryDate: "2028-02-24",
      initialQty: 3000,
      availableQty: 3000,
      purchasePricePerKg: 27.50,
      extraExpenses: 900,
      costPerKg: 27.80,
      totalValue: 83400,
      qualityStatus: "مطابق للمواصفات التصديرية (درجة أولى)",
      notes: "بامية زيرو مجمدة معبأة وجاهزة للشحن الفوري للتصدير",
      rawSources: [],
      suppliersSummary: [
        { supplierName: "مصنع الدلتا للأغذية المحفوظة", sharePct: 100.0 }
      ]
    }
  ],

  // DIRECT FINISHED GOODS PURCHASES (DEAL-XXXX)
  directPurchases: [
    {
      dealId: "DEAL-2026-001",
      date: "2026-08-23",
      supplierName: "شركة النيل للزراعات والتجميد",
      productName: "فراولة مجمدة IQF",
      station: "محطة النخيل",
      qtyKg: 5000,
      packageType: "كرتونة 10 كجم (5 طبقات)",
      packageCount: 500,
      purchasePricePerKg: 32.00,
      transportCost: 1500,
      totalCost: 161500,
      costPerKg: 32.30,
      generatedBatchId: "FG-DIR-2026-001",
      invoiceNo: "INV-NEL-8821",
      status: "تم الاستلام بمخزن الجاهز",
      notes: "صفقة بضاعة جاهزة واردة مباشرة معبأة في كراتين تصدير بدون تدوير داخلي"
    },
    {
      dealId: "DEAL-2026-002",
      date: "2026-08-24",
      supplierName: "مصنع الدلتا للأغذية المحفوظة",
      productName: "بامية ممتازة مجمدة",
      station: "محطة السلام",
      qtyKg: 3000,
      packageType: "كرتونة 8 كجم",
      packageCount: 375,
      purchasePricePerKg: 27.50,
      transportCost: 900,
      totalCost: 83400,
      costPerKg: 27.80,
      generatedBatchId: "FG-DIR-2026-002",
      invoiceNo: "INV-DLT-4109",
      status: "تم الاستلام بمخزن الجاهز",
      notes: "بامية زيرو مجمدة معبأة وجاهزة للشحن الفوري للتصدير"
    }
  ],

  // COMMERCIAL SALES ORDERS (ORD-XXXX)
  clientOrders: [
    {
      orderId: "ORD-2026-001",
      orderDate: "2026-08-20",
      customerId: "CUST-001",
      customerName: "شركة سما للتجارة والتصدير (هولندا)",
      productName: "فراولة مجمدة IQF",
      packagingSpec: "كرتونة 10 كجم (5 طبقات)",
      orderedQtyKg: 8000,
      unfulfilledQtyKg: 4000,
      unitPriceEur: 1.85,
      fxRate: 53.20,
      deliveryTerms: "FOB - ميناء الإسكندرية",
      targetShipDate: "2026-08-28",
      destinationPort: "ميناء روتردام",
      status: "قيد التجهيز والتخصيص"
    },
    {
      orderId: "ORD-2026-002",
      orderDate: "2026-08-22",
      customerId: "CUST-002",
      customerName: "مؤسسة النور للتوزيع والتوريدات (السعودية)",
      productName: "بامية ممتازة مجمدة",
      packagingSpec: "كرتونة 8 كجم (أكياس 400 جم)",
      orderedQtyKg: 3000,
      unfulfilledQtyKg: 3000,
      unitPriceEur: 2.10,
      fxRate: 53.20,
      deliveryTerms: "CIF - ميناء جدة الإسلامي",
      targetShipDate: "2026-09-02",
      destinationPort: "ميناء جدة الإسلامي",
      status: "جديدة"
    },
    {
      orderId: "ORD-2026-003",
      orderDate: "2026-08-23",
      customerId: "CUST-003",
      customerName: "شركة يوروفروست للأغذية (ألمانيا)",
      productName: "مانجو مكعبات مجمدة",
      packagingSpec: "كرتونة 10 كجم",
      orderedQtyKg: 3600,
      unfulfilledQtyKg: 3600,
      unitPriceEur: 2.40,
      fxRate: 53.20,
      deliveryTerms: "FOB - ميناء الإسكندرية",
      targetShipDate: "2026-09-05",
      destinationPort: "ميناء هامبورغ",
      status: "جديدة"
    }
  ],

  // EXPORT SHIPMENTS (SHP-XXXX)
  shipments: [
    {
      shipmentId: "SHP-2026-001",
      orderId: "ORD-2026-001",
      customerName: "شركة سما للتجارة والتصدير (هولندا)",
      productName: "فراولة مجمدة IQF",
      dispatchDate: "2026-08-25",
      containerNo: "MSCU-987654-3",
      sealNo: "SL-EGY-44910",
      shippingLine: "MSC (Mediterranean Shipping Company)",
      bookingNo: "BKG-2026-9901",
      shippedQtyKg: 4000,
      allocatedBatches: [
        { fgBatchId: "FG-PR-2026-001", qty: 4000, costPerKg: 31.56 }
      ],
      costs: {
        productionCost: 126240,
        inlandTrucking: 6500,
        oceanFreight: 22000,
        customsClearance: 4500,
        inspectionCertificates: 2500,
        portTerminalCharges: 3500
      },
      totalShipmentCost: 165240,
      sellingPriceEur: 1.85,
      fxRate: 53.20,
      grossRevenueEgp: 393680,
      netProfitEgp: 228440,
      marginPercent: 58.0,
      status: "تم الشحن والإبحار",
      destinationPort: "ميناء روتردام",
      audit: [
        { at: "2026-08-25 14:00", by: "م. أحمد محمود (Admin)", action: "DISPATCH", summary: "اعتماد وتصدير الحاوية MSCU-987654-3 وتخصيص 4000 كجم" }
      ]
    }
  ],

  // TREASURY & BANK ACCOUNTS
  treasuryAccounts: [
    { id: "ACC-01", name: "البنك التجاري الدولي CIB (EUR)", currency: "EUR", balance: 45000.00, accountNo: "100029384812" },
    { id: "ACC-02", name: "بنك قطر الوطني QNB (EGP)", currency: "EGP", balance: 1450000.00, accountNo: "203948571029" },
    { id: "ACC-03", name: "خزينة المحطة المركزية (EGP)", currency: "EGP", balance: 125000.00, accountNo: "CASH-MAIN-SAFE" }
  ],

  // UNIFIED GENERAL LEDGER & FINANCIAL TRANSACTIONS
  financialTransactions: [
    {
      txnId: "TXN-2026-001",
      date: "2026-08-15",
      type: "استحقاق توريد خام (AP)",
      partyType: "مورد خام",
      partyName: "مزارع الوادي الحديثة",
      amountEgp: 148000.00,
      refDoc: "LOT-RAW-001",
      description: "استحقاق توريد 8,000 كجم فراولة خام",
      status: "معتمد"
    },
    {
      txnId: "TXN-2026-002",
      date: "2026-08-18",
      type: "استحقاق توريد خام (AP)",
      partyType: "مورد خام",
      partyName: "شركة الخير للتنمية الزراعية",
      amountEgp: 96000.00,
      refDoc: "LOT-RAW-002",
      description: "استحقاق توريد 5,000 كجم فراولة خام",
      status: "معتمد"
    },
    {
      txnId: "TXN-2026-003",
      date: "2026-08-21",
      type: "استحقاق تشغيل وفرز (AP)",
      partyType: "مقاول عمالة",
      partyName: "مقاول أحمد للتجهيز",
      amountEgp: 9600.00,
      refDoc: "PR-2026-001",
      description: "أتعاب تشغيل وفرز 4,800 كجم فراولة مجمدة",
      status: "معتمد"
    },
    {
      txnId: "TXN-2026-004",
      date: "2026-08-23",
      type: "استحقاق شراء صفقة جاهزة (AP)",
      partyType: "مورد بضاعة جاهزة",
      partyName: "شركة النيل للزراعات والتجميد",
      amountEgp: 161500.00,
      refDoc: "DEAL-2026-001",
      description: "استحقاق شراء 5,000 كجم فراولة مجمدة IQF تامة الصنع",
      status: "معتمد"
    },
    {
      txnId: "TXN-2026-005",
      date: "2026-08-25",
      type: "استحقاق مبيعات تصدير (AR)",
      partyType: "عميل تصدير",
      partyName: "شركة سما للتجارة والتصدير (هولندا)",
      amountEgp: 393680.00,
      amountCurrency: 7400.00,
      currency: "EUR",
      refDoc: "SHP-2026-001",
      description: "فاتورة تصدير شحنة حاوية 4,000 كجم فراولة مجمدة",
      status: "معتمد"
    },
    {
      txnId: "TXN-2026-006",
      date: "2026-08-25",
      type: "سند تحصيل دفعة مقدمة (Inflow)",
      partyType: "عميل تصدير",
      partyName: "شركة سما للتجارة والتصدير (هولندا)",
      amountEgp: 200000.00,
      accountId: "ACC-01",
      accountName: "البنك التجاري الدولي CIB (EUR)",
      refDoc: "SHP-2026-001",
      description: "تحصيل دفعة بنكية تحت حساب الشحنة SHP-2026-001",
      status: "مسدد"
    }
  ],

  // INTER-STATION STOCK TRANSFERS
  stockTransfers: [
    {
      transferId: "TRF-2026-001",
      date: "2026-08-24",
      fromStation: "محطة النخيل",
      toStation: "محطة السلام",
      productName: "فراولة مجمدة IQF",
      batchId: "FG-PR-2026-001",
      qtyKg: 1000,
      truckPlate: "م ن هـ 4433",
      driverName: "سعد عبد الله",
      status: "تم الاستلام بنجاح"
    }
  ]
};

window.ERPState = {
  load() {
    const raw = localStorage.getItem(ERP_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.currentUser) parsed.currentUser = DEFAULT_USERS[0];
        if (!parsed.users) parsed.users = DEFAULT_USERS;
        if (!parsed.customers || parsed.customers.length === 0) parsed.customers = INITIAL_ERP_SCHEMA.customers;
        if (!parsed.suppliers || parsed.suppliers.length === 0) parsed.suppliers = INITIAL_ERP_SCHEMA.suppliers;
        if (!parsed.contractors || parsed.contractors.length === 0) parsed.contractors = INITIAL_ERP_SCHEMA.contractors;
        if (!parsed.stations || parsed.stations.length === 0) parsed.stations = INITIAL_ERP_SCHEMA.stations;
        if (!parsed.products || parsed.products.length === 0) parsed.products = INITIAL_ERP_SCHEMA.products;
        if (!parsed.supplies || parsed.supplies.length === 0) parsed.supplies = INITIAL_ERP_SCHEMA.supplies;
        if (!parsed.clientOrders || parsed.clientOrders.length === 0) parsed.clientOrders = INITIAL_ERP_SCHEMA.clientOrders;
        if (!parsed.shipments) parsed.shipments = INITIAL_ERP_SCHEMA.shipments;
        if (!parsed.directPurchases) parsed.directPurchases = INITIAL_ERP_SCHEMA.directPurchases;
        if (!parsed.treasuryAccounts) parsed.treasuryAccounts = INITIAL_ERP_SCHEMA.treasuryAccounts;
        if (!parsed.financialTransactions) parsed.financialTransactions = INITIAL_ERP_SCHEMA.financialTransactions;
        if (!parsed.stockTransfers) parsed.stockTransfers = INITIAL_ERP_SCHEMA.stockTransfers;
        return parsed;
      } catch (e) {
        console.error("Failed to parse ERP state, resetting to schema v3...", e);
      }
    }

    let state = JSON.parse(JSON.stringify(INITIAL_ERP_SCHEMA));
    this.save(state);
    return state;
  },

  save(state) {
    localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(state));
  },

  reset() {
    const fresh = JSON.parse(JSON.stringify(INITIAL_ERP_SCHEMA));
    this.save(fresh);
    return fresh;
  },

  getCurrentUser() {
    const state = this.load();
    return state.currentUser || DEFAULT_USERS[0];
  },

  setCurrentUser(userId) {
    const state = this.load();
    const found = (state.users || DEFAULT_USERS).find(u => u.id === userId);
    if (found) {
      state.currentUser = found;
      this.save(state);
      return found;
    }
    return state.currentUser;
  },

  can(action) {
    const user = this.getCurrentUser();
    if (!user) return true;
    if (user.role === "Admin" || user.role === "مدير النظام") return true;
    if (user.role === "Supervisor" || user.role === "مشرف") {
      return action !== "DELETE_OPERATION";
    }
    if (user.role === "Operator" || user.role === "مشغل") {
      return action === "CREATE_OPERATION";
    }
    if (user.role === "Storekeeper" || user.role === "أمين مخزن") {
      return action === "CREATE_OPERATION" || action === "DISPATCH_SHIPMENT";
    }
    if (user.role === "Viewer" || user.role === "مراقب") {
      return false;
    }
    return true;
  },

  // 1. MASTER DATA: CUSTOMERS & SUPPLIERS & PRODUCTS
  addCustomer(customerData) {
    const state = this.load();
    const id = `CUST-${String(state.customers.length + 1).padStart(3, '0')}`;
    const newCust = {
      id: id,
      code: customerData.code || `CUST-${Date.now().toString().slice(-4)}`,
      name: customerData.name,
      country: customerData.country || "دولي",
      destinationPort: customerData.destinationPort || "ميناء الوصول",
      currency: customerData.currency || "EUR",
      paymentTerms: customerData.paymentTerms || "تحويل بنكي",
      creditLimit: parseFloat(customerData.creditLimit) || 500000,
      contactPerson: customerData.contactPerson || "",
      phone: customerData.phone || "",
      email: customerData.email || "",
      status: "نشط",
      agreedProducts: customerData.agreedProducts || []
    };
    state.customers.push(newCust);
    this.save(state);
    return { success: true, customer: newCust, message: `تم تسجيل العميل (${newCust.name}) بنجاح كمرجع موحد.` };
  },

  addSupplier(supplierData) {
    const state = this.load();
    const id = `SUPP-${String(state.suppliers.length + 1).padStart(3, '0')}`;
    const newSupp = {
      id: id,
      code: supplierData.code || `SUPP-${Date.now().toString().slice(-4)}`,
      name: supplierData.name,
      type: supplierData.type || "مورد خام زراعي",
      product: supplierData.product || "خام",
      phone: supplierData.phone || "",
      location: supplierData.location || "",
      status: "معتمد"
    };
    state.suppliers.push(newSupp);
    this.save(state);
    return { success: true, supplier: newSupp, message: `تم تسجيل المورد (${newSupp.name}) بنجاح كمرجع موحد.` };
  },

  // 2. RAW MATERIAL PROCUREMENT (WITH QC GATE)
  addRawMaterialArrival(arrivalData) {
    const state = this.load();
    const dateStr = arrivalData.date || new Date().toISOString().substring(0, 10);
    const count = state.rawBatches.length + 1;
    const batchId = arrivalData.batchId || `LOT-RAW-${dateStr.replace(/-/g, '')}-${String(count).padStart(2, '0')}`;
    const netQty = parseFloat(arrivalData.netQty) || parseFloat(arrivalData.grossQty) - parseFloat(arrivalData.tareQty || 0) || 0;
    const unitPrice = parseFloat(arrivalData.unitPrice) || 0;
    const transportCost = parseFloat(arrivalData.transportCost) || 0;
    const totalRawCost = (netQty * unitPrice) + transportCost;
    const unitCost = netQty > 0 ? parseFloat((totalRawCost / netQty).toFixed(2)) : unitPrice;

    const newBatch = {
      batchId: batchId,
      station: arrivalData.station || "محطة النخيل",
      rawProduct: arrivalData.rawProduct || "فراولة",
      supplierName: arrivalData.supplierName || "مورد زراعي",
      initialQty: netQty,
      availableQty: netQty,
      unitCost: unitCost,
      receivedDate: dateStr,
      qcStatus: arrivalData.qcStatus || "APPROVED",
      brixDegree: parseFloat(arrivalData.brixDegree) || 8.5,
      truckPlate: arrivalData.truckPlate || "سيارة توريد"
    };

    state.rawBatches.unshift(newBatch);

    // Auto-create Supplier Payable Financial Voucher
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    state.financialTransactions.unshift({
      txnId: txnId,
      date: dateStr,
      type: "استحقاق توريد خام (AP)",
      partyType: "مورد خام",
      partyName: newBatch.supplierName,
      amountEgp: totalRawCost,
      refDoc: batchId,
      description: `استحقاق توريد ${netQty.toLocaleString()} كجم ${newBatch.rawProduct} خام باللوط ${batchId}`,
      status: "معتمد"
    });

    this.save(state);
    return { success: true, batch: newBatch, message: `تم قيد وارد الخام باللوط ${batchId} برصيد ${netQty.toLocaleString()} كجم وقيد مستحق للمورد!` };
  },

  // 3. PACKAGING PROCUREMENT
  addPackagingPurchase(purchaseData) {
    const state = this.load();
    const item = state.supplies.find(s => s.id === purchaseData.supplyId || s.name === purchaseData.name);
    const qty = parseFloat(purchaseData.qty) || 0;
    const unitPrice = parseFloat(purchaseData.unitPrice) || 0;
    const totalCost = qty * unitPrice;

    if (item) {
      item.stock = (item.stock || 0) + qty;
      item.unitPrice = unitPrice;
    } else {
      state.supplies.push({
        id: `SUP-${String(state.supplies.length + 1).padStart(2, '0')}`,
        code: `CTN-CUSTOM-${Date.now().toString().slice(-4)}`,
        name: purchaseData.name,
        category: purchaseData.category || "كرتونة",
        capacityKg: parseFloat(purchaseData.capacityKg) || 10,
        unit: purchaseData.unit || "كرتونة",
        stock: qty,
        unitPrice: unitPrice
      });
    }

    // Financial AP
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    state.financialTransactions.unshift({
      txnId: txnId,
      date: purchaseData.date || new Date().toISOString().substring(0, 10),
      type: "استحقاق توريد مستلزمات (AP)",
      partyType: "مورد مستلزمات",
      partyName: purchaseData.supplierName || "الشركة المصرية للكرتون",
      amountEgp: totalCost,
      refDoc: purchaseData.invoiceNo || `SUP-INV-${Date.now().toString().slice(-4)}`,
      description: `استحقاق شراء ${qty.toLocaleString()} ${purchaseData.unit || 'كرتونة'} ${purchaseData.name}`,
      status: "معتمد"
    });

    this.save(state);
    return { success: true, message: `تم استلام ${qty.toLocaleString()} مستلزم بنجاح وتحديث الرصيد بالمخزن!` };
  },

  // 4. DIRECT FINISHED GOODS PURCHASES
  addDirectPurchaseDeal(deal) {
    const state = this.load();
    const now = new Date();
    const dateStr = deal.date || now.toISOString().substring(0, 10);
    const dealCount = state.directPurchases.length + 1;
    const dealId = deal.dealId || `DEAL-2026-${String(dealCount).padStart(3, '0')}`;
    const batchId = deal.generatedBatchId || `FG-DIR-${dateStr.replace(/-/g, '')}-${String(dealCount).padStart(2, '0')}`;

    const qtyKg = parseFloat(deal.qtyKg) || 0;
    const purchasePricePerKg = parseFloat(deal.purchasePricePerKg) || 0;
    const transportCost = parseFloat(deal.transportCost) || 0;
    const totalPurchaseCost = qtyKg * purchasePricePerKg;
    const grandTotalCost = totalPurchaseCost + transportCost;
    const costPerKg = qtyKg > 0 ? parseFloat((grandTotalCost / qtyKg).toFixed(2)) : purchasePricePerKg;

    const newDeal = {
      dealId: dealId,
      date: dateStr,
      supplierName: deal.supplierName || "شركة النيل للزراعات والتجميد",
      productName: deal.productName || "فراولة مجمدة IQF",
      station: deal.station || "محطة النخيل",
      qtyKg: qtyKg,
      packageType: deal.packageType || "كرتونة 10 كجم (5 طبقات)",
      packageCount: parseInt(deal.packageCount) || Math.round(qtyKg / 10),
      purchasePricePerKg: purchasePricePerKg,
      transportCost: transportCost,
      totalCost: grandTotalCost,
      costPerKg: costPerKg,
      generatedBatchId: batchId,
      invoiceNo: deal.invoiceNo || `INV-DIR-${Date.now().toString().slice(-4)}`,
      status: "تم الاستلام بمخزن الجاهز",
      notes: deal.notes || "صفقة بضاعة جاهزة واردة مباشرة بدون تدوير داخلي"
    };

    const newFgBatch = {
      fgBatchId: batchId,
      sourceType: "DIRECT_PURCHASE",
      dealRef: dealId,
      supplierName: newDeal.supplierName,
      station: newDeal.station,
      productName: newDeal.productName,
      packageType: newDeal.packageType,
      packageCount: newDeal.packageCount,
      productionDate: deal.productionDate || dateStr,
      expiryDate: deal.expiryDate || "2028-02-23",
      initialQty: qtyKg,
      availableQty: qtyKg,
      purchasePricePerKg: purchasePricePerKg,
      extraExpenses: transportCost,
      costPerKg: costPerKg,
      totalValue: grandTotalCost,
      qualityStatus: deal.qualityStatus || "مطابق للمواصفات التصديرية (درجة أولى)",
      notes: newDeal.notes,
      rawSources: [],
      suppliersSummary: [
        { supplierName: newDeal.supplierName, sharePct: 100.0 }
      ]
    };

    state.directPurchases.unshift(newDeal);
    state.finishedGoodsBatches.unshift(newFgBatch);

    // Auto Financial AP
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    state.financialTransactions.unshift({
      txnId: txnId,
      date: dateStr,
      type: "استحقاق شراء صفقة جاهزة (AP)",
      partyType: "مورد بضاعة جاهزة",
      partyName: newDeal.supplierName,
      amountEgp: grandTotalCost,
      refDoc: dealId,
      description: `استحقاق شراء ${qtyKg.toLocaleString()} كجم بضاعة جاهزة ${newDeal.productName} بالدفعة ${batchId}`,
      status: "معتمد"
    });

    this.save(state);
    return {
      success: true,
      deal: newDeal,
      batch: newFgBatch,
      message: `تم تسجيل صفقة البضاعة الجاهزة ${dealId} وإضافة الباتش ${batchId} برصيد ${qtyKg.toLocaleString()} كجم مباشرة إلى مخزن الجاهز!`
    };
  },

  // 5. INDUSTRIAL PROCESSING OPERATION (WITH AUTO COSTING, FG CREATION & CONTRACTOR PAYABLE)
  createProcessingOperation(opData) {
    const state = this.load();
    const dateStr = opData.date || new Date().toISOString().substring(0, 10);
    const opCount = state.operations.length + 1;
    const opId = opData.id || `PR-2026-${String(opCount).padStart(3, '0')}`;
    const batchId = opData.generatedBatchId || `FG-PR-2026-${String(opCount).padStart(3, '0')}`;

    // Deduct raw materials
    const rawSources = [];
    const suppliersSummaryMap = {};
    let totalRawKg = 0;
    let totalRawCost = 0;

    (opData.rawIssues || []).forEach(ri => {
      const b = state.rawBatches.find(rb => rb.batchId === ri.batchId);
      const usedQty = parseFloat(ri.qty) || 0;
      if (b) {
        b.availableQty = Math.max(0, (b.availableQty || 0) - usedQty);
        rawSources.push({ batchId: b.batchId, supplierName: b.supplierName, qty: usedQty, unitCost: b.unitCost });
        suppliersSummaryMap[b.supplierName] = (suppliersSummaryMap[b.supplierName] || 0) + usedQty;
        totalRawKg += usedQty;
        totalRawCost += (usedQty * b.unitCost);
      }
    });

    // Deduct supplies
    let totalSuppliesConsumedCost = 0;
    let totalSuppliesWasteCost = 0;
    (opData.suppliesIssues || []).forEach(si => {
      const s = state.supplies.find(sup => sup.id === si.supplyId || sup.name === si.name);
      const consumed = parseFloat(si.consumed) || 0;
      const waste = parseFloat(si.waste) || 0;
      const withdrawn = consumed + waste;
      if (s) {
        s.stock = Math.max(0, (s.stock || 0) - withdrawn);
        totalSuppliesConsumedCost += (consumed * (si.unitCost || s.unitPrice));
        totalSuppliesWasteCost += (waste * (si.unitCost || s.unitPrice));
      }
    });

    const finishedOutputKg = parseFloat(opData.finishedOutputKg) || 0;
    const secondaryOutputKg = parseFloat(opData.secondaryOutputKg) || 0;
    const rawWasteKg = Math.max(0, totalRawKg - (finishedOutputKg + secondaryOutputKg));
    const yieldPercent = totalRawKg > 0 ? parseFloat(((finishedOutputKg / totalRawKg) * 100).toFixed(1)) : 0;

    // Inherit Contractor Rate
    const contractor = state.contractors.find(c => c.name === opData.contractor);
    const contractorRate = contractor ? contractor.tariffRatePerKg : (parseFloat(opData.contractorRate) || 2.00);
    const contractorCost = finishedOutputKg * contractorRate;
    const stationCost = parseFloat(opData.stationCost) || (finishedOutputKg * 2.50);
    const otherCost = parseFloat(opData.otherCost) || 0;

    const grandTotalCost = totalRawCost + totalSuppliesConsumedCost + totalSuppliesWasteCost + contractorCost + stationCost + otherCost;
    const costPerKg = finishedOutputKg > 0 ? parseFloat((grandTotalCost / finishedOutputKg).toFixed(2)) : 0;

    // Build DNA summary
    const suppliersSummary = Object.keys(suppliersSummaryMap).map(sName => ({
      supplierName: sName,
      sharePct: totalRawKg > 0 ? parseFloat(((suppliersSummaryMap[sName] / totalRawKg) * 100).toFixed(1)) : 0
    }));

    const newOp = {
      id: opId,
      date: dateStr,
      station: opData.station || "محطة النخيل",
      rawProduct: opData.rawProduct || "فراولة",
      finishedProduct: opData.finishedProduct || "فراولة مجمدة IQF",
      contractor: opData.contractor || "مقاول أحمد للتجهيز",
      locked: true,
      rawIssues: opData.rawIssues,
      suppliesIssues: opData.suppliesIssues,
      rawInputKg: totalRawKg,
      finishedOutputKg: finishedOutputKg,
      secondaryOutputKg: secondaryOutputKg,
      rawWasteKg: rawWasteKg,
      yieldPercent: yieldPercent,
      costs: {
        rawCost: totalRawCost,
        suppliesConsumedCost: totalSuppliesConsumedCost,
        suppliesWasteCost: totalSuppliesWasteCost,
        contractorCost: contractorCost,
        stationCost: stationCost,
        otherCost: otherCost
      },
      grandTotalCost: grandTotalCost,
      costPerKg: costPerKg,
      generatedBatchId: batchId,
      notes: opData.notes || "تشغيل معتمد وفرز درجة أولى مطابق للمواصفات التصديرية",
      audit: [
        { at: `${dateStr} ${new Date().toTimeString().substring(0, 5)}`, by: `${state.currentUser.name} (${state.currentUser.role})`, action: "CREATE_AND_LOCK", summary: `اعتماد تشغيلة الإنتاج ${opId} وتوليد باتش الجاهز ${batchId}` }
      ]
    };

    const newFgBatch = {
      fgBatchId: batchId,
      sourceType: "MANUFACTURED",
      sourceOpId: opId,
      station: newOp.station,
      productName: newOp.finishedProduct,
      productionDate: dateStr,
      initialQty: finishedOutputKg,
      availableQty: finishedOutputKg,
      costPerKg: costPerKg,
      totalValue: grandTotalCost,
      rawSources: rawSources,
      suppliersSummary: suppliersSummary
    };

    state.operations.unshift(newOp);
    state.finishedGoodsBatches.unshift(newFgBatch);

    // Auto Contractor Payable
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    state.financialTransactions.unshift({
      txnId: txnId,
      date: dateStr,
      type: "استحقاق تشغيل وفرز (AP)",
      partyType: "مقاول عمالة",
      partyName: newOp.contractor,
      amountEgp: contractorCost,
      refDoc: opId,
      description: `أتعاب تشغيل وفرز ${finishedOutputKg.toLocaleString()} كجم بالعملية ${opId}`,
      status: "معتمد"
    });

    this.save(state);
    return {
      success: true,
      operation: newOp,
      batch: newFgBatch,
      message: `تم اعتماد العملية ${opId} وتوليد باتش الجاهز ${batchId} برصيد ${finishedOutputKg.toLocaleString()} كجم بنجاح!`
    };
  },

  // 6. COMMERCIAL SALES ORDER SNAPSHOT
  addClientOrder(orderData) {
    const state = this.load();
    const customer = state.customers.find(c => c.id === orderData.customerId || c.name === orderData.customerName);
    const orderCount = state.clientOrders.length + 1;
    const orderId = `ORD-2026-${String(orderCount).padStart(3, '0')}`;
    const qty = parseFloat(orderData.orderedQtyKg) || 0;
    const unitPrice = parseFloat(orderData.unitPriceEur) || (customer ? customer.agreedProducts[0]?.targetPriceEur : 1.85);

    const newOrder = {
      orderId: orderId,
      orderDate: orderData.orderDate || new Date().toISOString().substring(0, 10),
      customerId: customer ? customer.id : "CUST-001",
      customerName: customer ? customer.name : orderData.customerName,
      productName: orderData.productName || "فراولة مجمدة IQF",
      packagingSpec: orderData.packagingSpec || "كرتونة 10 كجم (5 طبقات)",
      orderedQtyKg: qty,
      unfulfilledQtyKg: qty,
      unitPriceEur: unitPrice,
      fxRate: parseFloat(orderData.fxRate) || 53.20,
      deliveryTerms: orderData.deliveryTerms || "FOB - ميناء الإسكندرية",
      targetShipDate: orderData.targetShipDate || "2026-09-10",
      destinationPort: customer ? customer.destinationPort : "ميناء الوصول",
      status: "جديدة"
    };

    state.clientOrders.unshift(newOrder);
    this.save(state);
    return { success: true, order: newOrder, message: `تم قيد طلبية العميل ${orderId} برصيد ${qty.toLocaleString()} كجم وتثبيت شروط التعاقد!` };
  },

  // 7. EXPORT SHIPMENT DISPATCH (WITH INHERITANCE, STOCK DEDUCTION, AR REVENUE & COGS)
  createShipment(shipmentData) {
    const state = this.load();
    const dateStr = shipmentData.dispatchDate || new Date().toISOString().substring(0, 10);
    const shpCount = state.shipments.length + 1;
    const shipmentId = shipmentData.shipmentId || `SHP-2026-${String(shpCount).padStart(3, '0')}`;

    // Inherit from Order
    const order = state.clientOrders.find(o => o.orderId === shipmentData.orderId);
    if (!order) return { success: false, message: "لم يتم العثور على طلبية العميل المحددة." };

    const shippedQty = parseFloat(shipmentData.shippedQtyKg) || 0;
    if (shippedQty > order.unfulfilledQtyKg) {
      return { success: false, message: `كمية الشحنة (${shippedQty.toLocaleString()} كجم) تتجاوز الرصيد المتبقي بالطلبية (${order.unfulfilledQtyKg.toLocaleString()} كجم)!` };
    }

    // Deduct Allocated FG Batches
    let totalProdCost = 0;
    const allocatedBatchesSummary = [];

    (shipmentData.allocatedBatches || []).forEach(ab => {
      const fg = state.finishedGoodsBatches.find(b => b.fgBatchId === ab.fgBatchId);
      const allocQty = parseFloat(ab.qty) || 0;
      if (fg) {
        if (allocQty > fg.availableQty) {
          throw new Error(`الكمية المخصصة من الباتش ${fg.fgBatchId} تتجاوز الرصيد المتاح (${fg.availableQty} كجم)!`);
        }
        fg.availableQty -= allocQty;
        totalProdCost += (allocQty * fg.costPerKg);
        allocatedBatchesSummary.push({ fgBatchId: fg.fgBatchId, qty: allocQty, costPerKg: fg.costPerKg });
      }
    });

    // Update order fulfillment
    order.unfulfilledQtyKg = Math.max(0, order.unfulfilledQtyKg - shippedQty);
    order.status = order.unfulfilledQtyKg === 0 ? "مكتملة بالكامل" : "مشحونة جزئياً";

    const fxRate = order.fxRate || 53.20;
    const unitPriceEur = order.unitPriceEur || 1.85;
    const grossRevenueEgp = shippedQty * unitPriceEur * fxRate;

    const costs = shipmentData.costs || {
      productionCost: totalProdCost,
      inlandTrucking: 6500,
      oceanFreight: 22000,
      customsClearance: 4500,
      inspectionCertificates: 2500,
      portTerminalCharges: 3500
    };
    const totalShipmentCost = Object.values(costs).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const netProfitEgp = grossRevenueEgp - totalShipmentCost;
    const marginPercent = grossRevenueEgp > 0 ? parseFloat(((netProfitEgp / grossRevenueEgp) * 100).toFixed(1)) : 0;

    const newShipment = {
      shipmentId: shipmentId,
      orderId: order.orderId,
      customerName: order.customerName,
      productName: order.productName,
      dispatchDate: dateStr,
      containerNo: shipmentData.containerNo || "MSCU-123456-7",
      sealNo: shipmentData.sealNo || "SL-EGY-99881",
      shippingLine: shipmentData.shippingLine || "MSC",
      bookingNo: shipmentData.bookingNo || `BKG-${Date.now().toString().slice(-4)}`,
      shippedQtyKg: shippedQty,
      allocatedBatches: allocatedBatchesSummary,
      costs: costs,
      totalShipmentCost: totalShipmentCost,
      sellingPriceEur: unitPriceEur,
      fxRate: fxRate,
      grossRevenueEgp: grossRevenueEgp,
      netProfitEgp: netProfitEgp,
      marginPercent: marginPercent,
      status: "تم الشحن والإبحار",
      destinationPort: order.destinationPort,
      audit: [
        { at: `${dateStr} ${new Date().toTimeString().substring(0, 5)}`, by: `${state.currentUser.name} (${state.currentUser.role})`, action: "DISPATCH", summary: `اعتماد وتصدير الحاوية ${shipmentData.containerNo} بإجمالي ${shippedQty.toLocaleString()} كجم` }
      ]
    };

    state.shipments.unshift(newShipment);

    // Auto Customer Accounts Receivable (AR)
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    state.financialTransactions.unshift({
      txnId: txnId,
      date: dateStr,
      type: "استحقاق مبيعات تصدير (AR)",
      partyType: "عميل تصدير",
      partyName: order.customerName,
      amountEgp: grossRevenueEgp,
      amountCurrency: shippedQty * unitPriceEur,
      currency: order.currency || "EUR",
      refDoc: shipmentId,
      description: `فاتورة تصدير الشحنة ${shipmentId} للعميل ${order.customerName} بقيمة ${grossRevenueEgp.toLocaleString()} ج.م`,
      status: "معتمد"
    });

    this.save(state);
    return {
      success: true,
      shipment: newShipment,
      message: `تم اعتماد وتصدير الشحنة ${shipmentId} بنجاح وخصم الرصيد من مخزن الجاهز وتوليد فاتورة العميل!`
    };
  },

  // 8. TREASURY VOUCHERS (PAYMENTS & COLLECTIONS)
  addFinancialTransaction(txnData) {
    const state = this.load();
    const txnId = `TXN-${String(state.financialTransactions.length + 1).padStart(3, '0')}`;
    const amount = parseFloat(txnData.amountEgp) || 0;
    const isCollection = txnData.type.includes("تحصيل") || txnData.type.includes("Inflow");

    // Update Treasury account balance
    const account = state.treasuryAccounts.find(a => a.id === txnData.accountId || a.name === txnData.accountName) || state.treasuryAccounts[1];
    if (account) {
      if (isCollection) {
        account.balance += amount;
      } else {
        account.balance -= amount;
      }
    }

    const newTxn = {
      txnId: txnId,
      date: txnData.date || new Date().toISOString().substring(0, 10),
      type: txnData.type,
      partyType: txnData.partyType || "طرف تعامل",
      partyName: txnData.partyName,
      amountEgp: amount,
      accountId: account ? account.id : "ACC-02",
      accountName: account ? account.name : "بنك QNB (EGP)",
      refDoc: txnData.refDoc || "سند يدوي",
      description: txnData.description || "حركة مالية معتمدة",
      status: "مسدد"
    };

    state.financialTransactions.unshift(newTxn);
    this.save(state);
    return { success: true, transaction: newTxn, message: `تم قيد السند المالي ${txnId} وتحديث رصيد الحساب المالي والأطراف بنجاح!` };
  },

  // 9. INTER-STATION TRANSFER
  createStockTransfer(transferData) {
    const state = this.load();
    const transferId = `TRF-2026-${String(state.stockTransfers.length + 1).padStart(3, '0')}`;
    const batch = state.finishedGoodsBatches.find(b => b.fgBatchId === transferData.batchId);
    const qty = parseFloat(transferData.qtyKg) || 0;

    if (batch) {
      if (qty > batch.availableQty) {
        return { success: false, message: `الكمية المطلوب تحويلها (${qty} كجم) تتجاوز الرصيد المتاح (${batch.availableQty} كجم)!` };
      }
      batch.availableQty -= qty;
      batch.station = transferData.toStation; // Updated target destination
      batch.availableQty += qty;
    }

    const newTrf = {
      transferId: transferId,
      date: transferData.date || new Date().toISOString().substring(0, 10),
      fromStation: transferData.fromStation,
      toStation: transferData.toStation,
      productName: transferData.productName,
      batchId: transferData.batchId,
      qtyKg: qty,
      truckPlate: transferData.truckPlate || "سيارة نقل داخلي",
      driverName: transferData.driverName || "سائق المحطة",
      status: "تم الاستلام بنجاح"
    };

    state.stockTransfers.unshift(newTrf);
    this.save(state);
    return { success: true, transfer: newTrf, message: `تم توثيق إذن التحويل بين المحطات ${transferId} ونقل الرصيد إلى ${transferData.toStation}!` };
  },

  // 10. DYNAMIC FINANCIAL BALANCES & CALCULATORS
  getCustomerBalance(customerName) {
    const state = this.load();
    const invoices = state.financialTransactions
      .filter(t => t.partyName === customerName && t.type.includes("استحقاق مبيعات"))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    const collections = state.financialTransactions
      .filter(t => t.partyName === customerName && (t.type.includes("تحصيل") || t.type.includes("Inflow")))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    return invoices - collections;
  },

  getSupplierBalance(supplierName) {
    const state = this.load();
    const payables = state.financialTransactions
      .filter(t => t.partyName === supplierName && t.type.includes("استحقاق"))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    const payments = state.financialTransactions
      .filter(t => t.partyName === supplierName && (t.type.includes("سداد") || t.type.includes("Outflow")))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    return payables - payments;
  },

  getContractorBalance(contractorName) {
    const state = this.load();
    const payables = state.financialTransactions
      .filter(t => t.partyName === contractorName && t.type.includes("استحقاق تشغيل"))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    const payments = state.financialTransactions
      .filter(t => t.partyName === contractorName && (t.type.includes("سداد") || t.type.includes("Outflow")))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    return payables - payments;
  },

  getFinancialStatementsTotals() {
    const state = this.load();
    const totalReceivables = state.customers.reduce((acc, c) => acc + Math.max(0, this.getCustomerBalance(c.name)), 0);
    const totalPayables = state.suppliers.reduce((acc, s) => acc + Math.max(0, this.getSupplierBalance(s.name)), 0) +
                          state.contractors.reduce((acc, c) => acc + Math.max(0, this.getContractorBalance(c.name)), 0);
    const totalCollections = state.financialTransactions
      .filter(t => t.type.includes("تحصيل") || t.type.includes("Inflow"))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);
    const totalPayments = state.financialTransactions
      .filter(t => t.type.includes("سداد") || t.type.includes("Outflow"))
      .reduce((a, b) => a + (b.amountEgp || 0), 0);

    const totalRevenues = state.shipments.reduce((a, s) => a + (s.grossRevenueEgp || 0), 0);
    const totalCOGS = state.shipments.reduce((a, s) => a + (s.totalShipmentCost || 0), 0);
    const grossProfit = totalRevenues - totalCOGS;

    return {
      totalReceivables,
      totalPayables,
      totalCollections,
      totalPayments,
      totalRevenues,
      totalCOGS,
      grossProfit,
      netCashFlow: totalCollections - totalPayments
    };
  }
};
