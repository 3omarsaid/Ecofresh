export const dynamic = "force-dynamic";
import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "مركز التقارير الاستراتيجية — Nilotic Frost ERP",
};

export default function StrategicReportsHubPage() {
  const reportCards = [
    {
      title: "تقرير ربحية الشحنات والتصدير",
      description: "تحليل الإيرادات بالتصنيف، التكاليف التشغيلية، وصافي هامش الربح لكل شحنة ورقم حاوية.",
      href: "/reports/profitability",
      icon: TrendingUp,
      badge: "مالي وشحن",
      color: "emerald",
    },
    {
      title: "تقرير كفاءة ومقارنة المحطات",
      description: "مقارنة أداء محطات التجميد، متوسط نسب التصافي والهالك، وتكلفة تجهيز الكيلو جرام.",
      href: "/reports/stations",
      icon: Building2,
      badge: "تشغيلي وإنتاج",
      color: "blue",
    },
    {
      title: "بطاقة جودة وأداء الموردين",
      description: "تقييم جودة واردات الخام، معدلات القبول والرفض من الفحص الفني، وحجم التوريدات.",
      href: "/reports/suppliers",
      icon: Users,
      badge: "مشتريات وجودة",
      color: "purple",
    },
    {
      title: "مصفوفة أعمار ديون العملاء (AR Aging)",
      description: "متابعة الفواتير القائمة وتحليل فترات الائتمان (0-30، 31-60، +60 يوماً) لإدارة السيولة.",
      href: "/reports/aging",
      icon: Clock,
      badge: "ائتمان وتحصيل",
      color: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              مركز التقارير والتحليلات الاستراتيجية (Reports Hub)
            </h1>
            <p className="text-muted-foreground mt-1">
              منصة متكاملة لوحدات اتخاذ القرار ومراقبة الأداء التشغيلي والمالي للمجموعة
            </p>
          </div>
        </div>
      </div>

      {/* Report Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.href} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-muted rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {report.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {report.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full gap-2 justify-between">
  <Link href={report.href}>
                      <span>عرض التقرير التفصيلي</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </Link>
</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
