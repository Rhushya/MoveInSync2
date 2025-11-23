"use client";

import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../lib/api";
import { cn } from "../lib/utils";

interface DashboardProps {
  token?: string;
}

export function Dashboard({ token }: DashboardProps) {
  const [summary, setSummary] = useState<{ monthly_total: number; vendors: number; pending: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDashboardSummary(token)
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, [token]);

  if (!token) {
    return <p className="text-sm text-muted-foreground">Provide a token to view the dashboard.</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!summary) {
    return <p className="text-sm text-muted-foreground">Loading summary...</p>;
  }

  const cards = [
    { label: "Total Billed (Month)", value: `₹${summary.monthly_total.toFixed(2)}` },
    { label: "Total Vendors", value: summary.vendors },
    { label: "Pending Trips", value: summary.pending },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={cn("rounded-xl border bg-white/80 p-4 shadow-sm dark:bg-zinc-900/40")}> 
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
