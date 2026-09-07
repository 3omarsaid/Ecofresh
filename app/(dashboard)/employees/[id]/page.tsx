export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/actions/employees";
import { getEmployeeLedger } from "@/lib/data/employee-ledger";
import { getStationsForSelect } from "@/actions/contractors";
import { getTreasuryAccounts } from "@/actions/treasury";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Coins,
  FileText,
  Mail,
  Phone,
  Scale,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { EmployeeLedgerTable } from "@/components/modules/employees/EmployeeLedgerTable";
import { AddTransactionDialog } from "@/components/modules/employees/AddTransactionDialog";
import { EmployeeForm } from "@/components/modules/employees/EmployeeForm";
import { formatCurrency } from "@/lib/currency";

export const metadata = {
  title: "تفاصيل وكشف حساب الموظف — Nilotic Frost ERP",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EmployeeDetailsPage({ params }: PageProps) {
  const [employee, ledger, stations, accounts] = await Promise.all([
    getEmployeeById(params.id),
    getEmployeeLedger(params.id),
    getStationsForSelect(),
    getTreasuryAccounts(),
  ]);

  if (!employee) {
    notFound();
  }

  const { summary, rows } = ledger;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link
              href="/employees"
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              دليل الموظفين
            </Link>
            <span>/</span>
            <span>كشف حساب الموظف</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="h-6 w-6 text-emerald-800" />
            <span>{employee.name}</span>
            <Badge variant="outline" className="font-mono text-xs bg-gray-50">
              {employee.id}
            </Badge>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <EmployeeForm
            stations={stations}
            employee={employee}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5 font-bold">
                تعديل البيانات
              </Button>
            }
          />

          <AddTransactionDialog
            employeeId={employee.id}
            employeeName={employee.name}
            monthlySalary={summary.totalMonthlySalary}
            treasuryAccounts={accounts.map((a) => ({
              id: a.id,
              name: a.name,
              balance: Number(a.balance),
              currency: a.currency,
            }))}
            trigger={
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5 shadow-sm">
                <Coins className="h-4 w-4" />
                + قيد حركة مالية
              </Button>
            }
          />
        </div>
      </div>

      {/* Hero Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 block mb-1">الراتب الشهري والبدلات</span>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(summary.totalMonthlySalary)}
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            أساسي: {formatCurrency(summary.basicSalary)} + بدلات: {formatCurrency(summary.allowances)}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 block mb-1">إجمالي المستحق للموظف (+)</span>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {formatCurrency(summary.totalDue)}
          </div>
          <span className="text-[11px] text-gray-400">رواتب ومكافآت وبدلات مستحقة</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 block mb-1">إجمالي المنصرف والمسدد (-)</span>
          <div className="text-xl font-bold text-rose-700 font-mono">
            {formatCurrency(summary.totalPaidOrDeducted)}
          </div>
          <span className="text-[11px] text-gray-400">سلف ومصروفات وخصومات</span>
        </div>

        <div className="bg-gradient-to-br from-[#012d1d] to-[#02472e] text-white rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-200 block mb-1">صافي الرصيد الحالي</span>
          <div className="text-xl font-bold font-mono">
            {formatCurrency(Math.abs(summary.remaining))}
          </div>
          <span className="text-xs font-medium text-emerald-100">
            {summary.balanceText}
          </span>
        </div>
      </div>

      {/* Employee Master Details Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-700" />
            البيانات الوظيفية والإدارية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">المسمى الوظيفي</span>
            <strong className="text-gray-800">{employee.position}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">القسم الإداري</span>
            <strong className="text-gray-800">{employee.department}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">المحطة التابع لها</span>
            <strong className="text-gray-800">{employee.station?.name || "عام لكافة المحطات"}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">نوع التعاقد</span>
            <strong className="text-gray-800">{employee.employmentType}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">رقم الهاتف</span>
            <strong className="text-gray-800 font-mono">{employee.phone || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">الرقم القومي</span>
            <strong className="text-gray-800 font-mono">{employee.nationalId || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">البريد الإلكتروني</span>
            <strong className="text-gray-800">{employee.email || "—"}</strong>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">الحالة الوظيفية</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {employee.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-800" />
            سجل حركات كشف الحساب التراكمي (Running Balance Ledger)
          </h2>
          <span className="text-xs text-gray-500 font-mono font-medium">
            عدد الحركات: {rows.length}
          </span>
        </div>

        <EmployeeLedgerTable rows={rows} />
      </div>
    </div>
  );
}
