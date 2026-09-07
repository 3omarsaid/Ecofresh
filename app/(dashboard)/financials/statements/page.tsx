export const dynamic = "force-dynamic";

import React from "react";
import { getPartiesList, getAccountStatementReport } from "@/actions/account-statements";
import { StatementHub } from "@/components/modules/financials/statements/statement-hub";

interface PageProps {
  searchParams: {
    partyType?: string;
    partyId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default async function AccountStatementsPage({ searchParams }: PageProps) {
  const partiesData = await getPartiesList();

  const partyType = searchParams.partyType || "SUPPLIERS";
  let defaultPartyId = searchParams.partyId;

  if (!defaultPartyId) {
    if (partyType.toUpperCase().includes("CUSTOMER")) {
      defaultPartyId = partiesData.customers[0]?.id || "";
    } else if (partyType.toUpperCase().includes("CONTRACTOR")) {
      defaultPartyId = partiesData.contractors[0]?.id || "";
    } else if (partyType.toUpperCase().includes("EMPLOYEE")) {
      defaultPartyId = partiesData.employees[0]?.id || "";
    } else {
      defaultPartyId = partiesData.suppliers[0]?.id || "";
    }
  }

  const statementReport = await getAccountStatementReport({
    partyType,
    partyId: defaultPartyId,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
  });

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 max-w-7xl">
      <StatementHub
        initialReport={statementReport}
        partiesData={partiesData}
        searchParams={{
          partyType,
          partyId: defaultPartyId,
          dateFrom: searchParams.dateFrom,
          dateTo: searchParams.dateTo,
        }}
      />
    </div>
  );
}
