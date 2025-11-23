"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-10 font-sans text-zinc-900 dark:from-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-indigo-600">MoveInSync</p>
          <h1 className="text-3xl font-semibold">Secure access to your trips</h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account and instantly see the trips or billing tasks that belong to you.
            Admins can switch views and inspect every user from a single dropdown.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
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
            {currentUser && (
              <p className="text-xs text-emerald-600">Currently signed in as {currentUser.email}</p>
            )}
          </form>

          <section className="space-y-4 rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600">Workspace</p>
                <h2 className="text-xl font-semibold">
                  {currentUser ? `Hello, ${currentUser.email}` : "Sign in to view your tasks"}
                </h2>
                {currentUser && (
                  <p className="text-sm text-muted-foreground">
                    Role: {currentUser.is_admin ? "Admin (full visibility)" : currentUser.role}
                  </p>
                )}
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Sign out
                </button>
              )}
            </div>

            {canViewSwitcher && (
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
            )}

            {loadingTasks && <p className="text-sm text-muted-foreground">Loading tasks…</p>}
            {!loadingTasks && currentUser && visibleTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks found for this user.</p>
            )}

            {!loadingTasks && visibleTasks.length > 0 && (
              <ul className="space-y-3">
                {visibleTasks.map((task) => (
                  <li key={task.id} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Distance: {task.distance_km.toFixed(1)} km</p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {task.duration_minutes} min · Extra km: {task.extra_km} · Extra hrs: {task.extra_hours}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(task.date).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
