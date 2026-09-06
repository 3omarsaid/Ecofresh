"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, UserPlus } from "lucide-react";

interface EmployeeFormProps {
  stations: Array<{ id: string; name: string }>;
  employee?: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EmployeeForm({
  stations,
  employee,
  trigger,
  onSuccess,
}: EmployeeFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!employee;

  const [formData, setFormData] = useState({
    name: employee?.name || "",
    nationalId: employee?.nationalId || "",
    phone: employee?.phone || "",
    email: employee?.email || "",
    position: employee?.position || "",
    department: employee?.department || "الإنتاج",
    stationId: employee?.stationId || "",
    employmentType: employee?.employmentType || "دوام كامل",
    basicSalary: employee?.basicSalary ? String(employee.basicSalary) : "0",
    allowances: employee?.allowances ? String(employee.allowances) : "0",
    status: employee?.status || "نشط",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res;
      if (isEditing) {
        res = await updateEmployee(employee.id, formData);
      } else {
        res = await createEmployee(formData);
      }

      if (!res.success) {
        setError(res.error || "حدث خطأ أثناء حفظ بيانات الموظف");
      } else {
        setOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#012d1d] hover:bg-[#1b4332] text-white gap-2 font-bold shadow-md">
            <UserPlus className="h-4 w-4" />
            + إضافة موظف جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-700" />
            {isEditing ? `تعديل بيانات الموظف (${employee.name})` : "تسجيل موظف جديد"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-gray-700">
                اسم الموظف الثلاثي *
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أحمد علي محمود"
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nationalId" className="text-xs font-bold text-gray-700">
                الرقم القومي
              </Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="29501011234567"
                className="text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-gray-700">
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01012345678"
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-700">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmed.ali@frozex-erp.com"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="position" className="text-xs font-bold text-gray-700">
                المسمى الوظيفي *
              </Label>
              <Input
                id="position"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="مهندس إنتاج / محاسب"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-bold text-gray-700">
                القسم الإداري *
              </Label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#012d1d]"
              >
                <option value="الإنتاج">الإنتاج</option>
                <option value="المخازن">المخازن</option>
                <option value="الإدارة المالية">الإدارة المالية</option>
                <option value="مراقبة الجودة">مراقبة الجودة</option>
                <option value="الصيانة">الصيانة والخدمات</option>
                <option value="المشتريات">المشتريات واللوجستيات</option>
                <option value="الإدارة العامة">الإدارة العامة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stationId" className="text-xs font-bold text-gray-700">
                المحطة التابع لها
              </Label>
              <select
                id="stationId"
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#012d1d]"
              >
                <option value="">عام لكافة المحطات</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900">بيانات الأجر والتعاقد:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="basicSalary" className="text-xs font-bold text-gray-700">
                  الراتب الأساسي (ج.م) *
                </Label>
                <Input
                  id="basicSalary"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="text-sm font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allowances" className="text-xs font-bold text-gray-700">
                  البدلات الشهرية (ج.م)
                </Label>
                <Input
                  id="allowances"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  className="text-sm font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-gray-700">
                  حالة الموظف
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#012d1d]"
                >
                  <option value="نشط">نشط (على رأس العمل)</option>
                  <option value="إجازة">في إجازة</option>
                  <option value="موقوف">موقوف مؤقتاً</option>
                  <option value="منتهي الخدمة">منتهي الخدمة</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {isEditing ? "حفظ التعديلات" : "تسجيل الموظف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
