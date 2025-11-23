"use client";

import { FormEvent, useState } from "react";

interface BillingConfigFormProps {
  onSubmit?: (config: Record<string, number>) => void;
}

export function BillingConfigForm({ onSubmit }: BillingConfigFormProps) {
  const [perKm, setPerKm] = useState("1.5");
  const [perHour, setPerHour] = useState("10");
  const [extraKmRate, setExtraKmRate] = useState("2.5");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      per_km: Number(perKm),
      per_hour: Number(perHour),
      extra_km_rate: Number(extraKmRate),
    };
    onSubmit?.(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-white/80 p-4 shadow-sm dark:bg-zinc-900/40">
      <div>
        <label className="text-sm font-medium">Per KM Rate</label>
        <input
          type="number"
          step="0.1"
          value={perKm}
          onChange={(e) => setPerKm(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Per Hour Rate</label>
        <input
          type="number"
          step="0.1"
          value={perHour}
          onChange={(e) => setPerHour(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Extra KM Rate</label>
        <input
          type="number"
          step="0.1"
          value={extraKmRate}
          onChange={(e) => setExtraKmRate(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Save Config
      </button>
    </form>
  );
}
