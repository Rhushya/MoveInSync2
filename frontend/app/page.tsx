"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { BillingConfigForm } from "../components/billing-config-form";
import { Dashboard } from "../components/dashboard";
import { ReportsExport } from "../components/reports-export";
import {
  fetchCurrentUser,
  fetchTasks,
  fetchUsers,
  login,
  signup,
  type Task,
  type User,
} from "../lib/api";

const TOKEN_STORAGE_KEY = "moviesync-token";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("password");
  const [tenantId, setTenantId] = useState("1");
  const [role, setRole] = useState("employee");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    const cached = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (cached) {
      setToken(cached);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    async function hydrateSession() {
      if (!token) {
        setCurrentUser(null);
        setTasks([]);
        setUserOptions([]);
        return;
      }
      try {
        const user = await fetchCurrentUser(token);
        setCurrentUser(user);
        setStatus(null);
      } catch (error) {
        console.error(error);
        setStatus("Session expired. Please sign in again.");
        setToken(null);
      }
    }
    hydrateSession();
  }, [token]);

  useEffect(() => {
    async function loadUsers() {
      if (!token || !currentUser?.is_admin) {
        setUserOptions(currentUser ? [currentUser] : []);
        return;
      }
      try {
        const users = await fetchUsers(token);
        setUserOptions(users);
      } catch (error) {
        console.error(error);
        setStatus("Unable to load user list");
      }
    }
    loadUsers();
  }, [token, currentUser]);

  useEffect(() => {
    async function loadTasks() {
      if (!token || !currentUser) {
        setTasks([]);
        return;
      }
      setLoadingTasks(true);
      try {
        const filterForAdmin = currentUser.is_admin && selectedUserId !== "all" ? Number(selectedUserId) : undefined;
        const data = await fetchTasks(token, filterForAdmin);
        setTasks(data);
      } catch (error) {
        console.error(error);
        setStatus("Unable to load tasks for this user");
      } finally {
        setLoadingTasks(false);
      }
    }
    loadTasks();
  }, [token, currentUser, selectedUserId]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const response = await login(email, password);
      setToken(response.access_token);
      setMode("login");
      setStatus("Authenticated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setStatus("Creating account...");
    try {
      const response = await signup({
        email,
        password,
        tenantId: Number(tenantId),
        role,
      });
      setToken(response.access_token);
      setMode("login");
      setStatus("Account created. You are now signed in.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Signup failed");
    }
  }

  function handleLogout() {
    setToken(null);
    setCurrentUser(null);
    setTasks([]);
    setSelectedUserId("all");
    setStatus("Signed out.");
  }

  const handleSubmit = mode === "login" ? handleLogin : handleSignup;

  const canViewSwitcher = Boolean(currentUser?.is_admin && userOptions.length > 0);

  useEffect(() => {
    if (!canViewSwitcher && selectedUserId !== "all") {
      setSelectedUserId("all");
      return;
    }
    if (
      canViewSwitcher &&
      selectedUserId !== "all" &&
      !userOptions.some((user) => `${user.id}` === selectedUserId)
    ) {
      setSelectedUserId("all");
    }
  }, [canViewSwitcher, selectedUserId, userOptions]);

  const visibleTasks = useMemo(() => tasks.slice(0, 100), [tasks]);
  const isAuthenticated = Boolean(token && currentUser);

  const authForm = (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur"
    >
      <div className="flex gap-2 rounded-lg border bg-slate-50 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md px-3 py-2 ${mode === "login" ? "bg-white shadow" : "text-muted-foreground"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md px-3 py-2 ${mode === "signup" ? "bg-white shadow" : "text-muted-foreground"}`}
        >
          Sign up
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      {mode === "signup" && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tenant ID</label>
            <input
              type="number"
              min={1}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="employee">Employee</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
        </>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {mode === "login" ? "Sign in" : "Create account"}
      </button>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </form>
  );

  const viewerLabel =
    selectedUserId === "all"
      ? currentUser?.is_admin
        ? "all users"
        : currentUser?.email ?? "your trips"
      : userOptions.find((user) => `${user.id}` === selectedUserId)?.email ?? "selected user";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-16 font-sans text-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-indigo-600">MoveInSync</p>
            <h1 className="text-3xl font-semibold">Sign in to your billing cockpit</h1>
            <p className="text-sm text-muted-foreground">
              Use your company email to authenticate. Admins can switch between users after logging in.
            </p>
          </header>

          {authForm}
          <p className="rounded-2xl border bg-white/70 px-4 py-3 text-center text-sm text-muted-foreground">
            Demo access: admin@acme.com / 123 or admin1@acme.com / 123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-10 font-sans text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600">MoveInSync</p>
            <h1 className="text-3xl font-semibold">Welcome back, {currentUser?.email}</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser?.is_admin ? "Admin access · full tenant visibility" : "You’re viewing your personal workspace"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </header>

        {status && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{status}</p>}

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent trips</h2>
              <span className="text-xs uppercase tracking-wide text-slate-500">{visibleTasks.length} entries</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing activity for {viewerLabel}.
            </p>
            {loadingTasks && <p className="mt-4 text-sm text-muted-foreground">Loading tasks…</p>}
            {!loadingTasks && visibleTasks.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">No trips recorded for this view.</p>
            )}
            {!loadingTasks && visibleTasks.length > 0 && (
              <ul className="mt-4 space-y-3">
                {visibleTasks.map((task) => (
                  <li key={task.id} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{task.distance_km.toFixed(1)} km · {task.duration_minutes} min</p>
                        <p className="text-xs text-muted-foreground">
                          Extra km: {task.extra_km} · Extra hrs: {task.extra_hours}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(task.date).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Viewer controls</h2>
            {canViewSwitcher ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">View tasks for</label>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="all">All users</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You’re viewing your own trips. Contact an admin if you need broader access.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Currently scoped to {viewerLabel}.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur lg:col-span-3">
            <h3 className="mb-4 text-lg font-semibold">Key Performance Indicators</h3>
            <Dashboard token={token ?? undefined} />
          </section>

          <section className="rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold">Adjust Billing Configuration</h3>
            <BillingConfigForm onSubmit={(config) => setStatus(`Config saved: ${JSON.stringify(config)}`)} />
          </section>

          <section className="rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold">Export Vendor Reports</h3>
            <ReportsExport token={token ?? undefined} />
          </section>
        </section>
      </div>
    </div>
  );
}
