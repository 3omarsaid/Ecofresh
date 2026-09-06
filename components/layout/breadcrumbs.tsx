"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { pageTitleMap } from "@/config/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const breadcrumbsList: { title: string; href: string }[] = [];
  let accumulatedPath = "";

  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += `/${segments[i]}`;
    const title = pageTitleMap[accumulatedPath] || segments[i];
    breadcrumbsList.push({ title, href: accumulatedPath });
  }

  return (
    <Breadcrumb dir="rtl">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">الرئيسية</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbsList.map((item, index) => {
          const isLast = index === breadcrumbsList.length - 1;
          if (item.href === "/dashboard" && index === 0) {
            return null;
          }

          return (
            <div key={item.href} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
