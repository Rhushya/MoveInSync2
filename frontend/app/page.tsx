"use client";

import { FormEvent, useState } from "react";

import { BillingConfigForm } from "../components/billing-config-form";
import { Dashboard } from "../components/dashboard";
import { ReportsExport } from "../components/reports-export";
import { login } from "../lib/api";

export default function Home() {
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("password");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const response = await login(email, password);
      setToken(response.access_token);
      setStatus("Authenticated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-10 font-sans text-zinc-900 dark:from-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-indigo-600">MoveInSync</p>
          <h1 className="text-3xl font-semibold">Billing, Reporting & Monitoring cockpit</h1>
          <p className="text-sm text-muted-foreground">
            Authenticate, inspect vendor billing models, export vendor CSVs, and monitor aggregate KPIs in one place.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleLogin} className="space-y-3 rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-medium">1. Authenticate</h2>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Sign in
            </button>
            {status && <p className="text-sm text-muted-foreground">{status}</p>}
          </form>

          <div className="lg:col-span-2 space-y-4 rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-medium">2. Monitor key KPIs</h2>
            <Dashboard token={token ?? undefined} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-medium">3. Adjust billing configs</h2>
            <BillingConfigForm onSubmit={(config) => setStatus(`Config saved: ${JSON.stringify(config)}`)} />
          </div>
          <div>
            <h2 className="mb-3 text-lg font-medium">4. Export vendor reports</h2>
            <ReportsExport token={token ?? undefined} />
          </div>
        </section>
      </div>
    </div>
  );
}
