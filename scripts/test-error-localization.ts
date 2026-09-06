import { prisma } from "../lib/prisma";
import { formatActionError } from "../lib/error-handler";
import { Prisma } from "@prisma/client";

async function runErrorLocalizationTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING REAL PRISMA ERROR LOCALIZATION TESTS");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: P2002 Duplicate Station Code / Name
  totalTests++;
  console.log("--- TEST 1: P2002 Unique Constraint Violation ---");
  try {
    const existingStation = await prisma.station.findFirst();
    if (existingStation) {
      // Attempt creating a station with duplicate id or code
      await prisma.station.create({
        data: {
          id: existingStation.id,
          name: existingStation.name,
          location: "موقع تجريبي",
          electricityRatePerKg: 0.5,
        },
      });
    }
  } catch (err: any) {
    const localizedMessage = formatActionError(err);
    console.log(`- Raw Prisma Exception Code: ${err.code}`);
    console.log(`- Localized Message Returned to User: "${localizedMessage}"`);

    if (
      !localizedMessage.includes("Prisma") &&
      !localizedMessage.includes("P2002") &&
      localizedMessage.includes("مكررة") || localizedMessage.includes("مسجل مسبقاً") || localizedMessage.includes("فريد")
    ) {
      console.log("✅ TEST 1 PASSED: Clear Arabic error returned without leaking Prisma details.");
      passedTests++;
    } else {
      console.log("❌ TEST 1 FAILED.");
    }
  }

  // Test 2: P2003 Foreign Key Constraint Violation
  totalTests++;
  console.log("\n--- TEST 2: P2003 Foreign Key Constraint Violation ---");
  try {
    // Attempt deleting a station that has stock locations / dependencies
    const stationWithDeps = await prisma.station.findFirst({
      where: { stockLocations: { some: {} } },
    });

    if (stationWithDeps) {
      await prisma.station.delete({
        where: { id: stationWithDeps.id },
      });
    } else {
      // Create artificial P2003 error
      const p2003Err = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "5.0.0",
      });
      throw p2003Err;
    }
  } catch (err: any) {
    const localizedMessage = formatActionError(err);
    console.log(`- Raw Prisma Exception Code: ${err.code}`);
    console.log(`- Localized Message Returned to User: "${localizedMessage}"`);

    if (
      !localizedMessage.includes("Prisma") &&
      !localizedMessage.includes("P2003") &&
      localizedMessage.includes("لارتباط السجل") || localizedMessage.includes("سجلات")
    ) {
      console.log("✅ TEST 2 PASSED: Clear Arabic error returned without leaking Prisma details.");
      passedTests++;
    } else {
      console.log("❌ TEST 2 FAILED.");
    }
  }

  // Test 3: Existing Custom Arabic Business Messages (e.g. Stock Over-withdrawal)
  totalTests++;
  console.log("\n--- TEST 3: Preservation of Existing Custom Arabic Business Error ---");
  const customArabicErr = new Error("الكمية المطلوبة سحبها من اللوط LOT-001 (5000 كجم) تتجاوز المتاح (1200 كجم)");
  const localizedMessage3 = formatActionError(customArabicErr);
  console.log(`- Raw Custom Error: "${customArabicErr.message}"`);
  console.log(`- Formatted Error Output: "${localizedMessage3}"`);

  if (localizedMessage3 === customArabicErr.message) {
    console.log("✅ TEST 3 PASSED: Custom Arabic business rules pass through untouched.");
    passedTests++;
  } else {
    console.log("❌ TEST 3 FAILED.");
  }

  console.log("\n=================================================");
  console.log(`📊 LOCALIZATION TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log("=================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runErrorLocalizationTests();
