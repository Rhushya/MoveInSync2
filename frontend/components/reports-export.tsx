"use client";

import { useState } from "react";
import { downloadVendorReport } from "../lib/api";

interface ReportsExportProps {
  token?: string;
}

export function ReportsExport({ token }: ReportsExportProps) {
  const [vendorId, setVendorId] = useState("1");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [status, setStatus] = useState<string | null>(null);

  async function handleDownload() {
    try {
      const data = await downloadVendorReport({
        vendorId: Number(vendorId),
        year: Number(year),
        month: Number(month),
        token,
      });
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `vendor_${vendorId}_${year}_${month}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Export ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to export");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white/80 p-4 shadow-sm dark:bg-zinc-900/40">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Vendor ID</label>
          <input
            type="number"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>
      <button
        type="button"
        disabled={!token}
        onClick={handleDownload}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Download CSV
      </button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
