export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, User } from "lucide-react";
import { getPartyStatement } from "@/lib/data/ledger";
import { getTreasuryAccounts } from "@/actions/treasury";
import { PartyFinancialSummary } from "@/components/modules/financials/party-financial-summary";
import { StatementFilters } from "@/components/modules/financials/statement-filters";
import { RunningStatementTable } from "@/components/modules/financials/running-statement-table";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    partyId: string;
  };
  searchParams?: {
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
}

export default async function PartyStatementPage({ params, searchParams }: PageProps) {
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const dateFrom = searchParams?.dateFrom;
  const dateTo = searchParams?.dateTo;

  const [statement, accounts] = await Promise.all([
    getPartyStatement({
      partyId: params.partyId,
      dateFrom,
      dateTo,
      page,
      pageSize: 50,
    }),
    getTreasuryAccounts(),
  ]);

  if (!statement.partyInfo && statement.rows.length === 0) {
    notFound();
  }

  const partyName = statement.partyInfo?.partyName || params.partyId;
  const partyType = statement.partyInfo?.partyType || "حساب طرف";

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/financials"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              دفتر الأستاذ العام
            </Link>
            <span>/</span>
            <span>كشف حساب تفصيلي</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            كشف حساب: {partyName}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <User className="w-4 h-4" />
            تصنيف الطرف: <span className="font-medium text-foreground">{partyType}</span> (كود: {params.partyId})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
  <Link href="/financials">العودة للأستاذ العام</Link>
</Button>
        </div>
      </div>

      {/* Hero Financial Summary & Quick Actions */}
      {statement.summary && (
        <PartyFinancialSummary
          summary={statement.summary}
          treasuryAccounts={accounts}
        />
      )}

      {/* Date Filters & Controls */}
      <StatementFilters
        totalCount={statement.pagination.totalCount}
        currentPage={statement.pagination.page}
        totalPages={statement.pagination.totalPages}
      />

      {/* Statement Ledger Table with Continuous Running Balance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            حركات الرصيد التراكمي (Running Balance)
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {statement.rows.length} حركة معروضة من أصل {statement.pagination.totalCount}
          </span>
        </div>

        <RunningStatementTable
          rows={statement.rows}
          openingBalance={statement.openingBalance}
          closingBalance={statement.closingBalance}
        />
      </div>
    </div>
  );
}
