import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nilotic Frost ERP — نظام إدارة التصدير",
  description: "نظام إدارة موارد المؤسسة الموحد لشركات تصدير الحاصلات الزراعية المجمدة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexSansArabic.className} ${ibmPlexSansArabic.variable}`}>
      <body className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans antialiased font-tabular-nums">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
