import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { date: "desc" },
  });

  const data = transactions.map((t) => ({
    "رقم القيد": t.txnId,
    "التاريخ": t.date.toISOString().substring(0, 10),
    "نوع الحركة": t.type,
    "نوع الطرف": t.partyType,
    "اسم الطرف": t.partyName,
    "المبلغ بالجنيه": Number(t.amountEgp),
    "المبلغ بالعملة": t.amountCurrency ? Number(t.amountCurrency) : "",
    "العملة": t.currency,
    "المستند المرجعي": t.refDoc,
    "الحساب المالي": t.accountName || "",
    "البيان والشرح": t.description,
    "الحالة": t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "دفتر الأستاذ العام");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="General-Ledger.xlsx"',
    },
  });
}
