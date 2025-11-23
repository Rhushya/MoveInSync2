const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type User = {
  id: number;
  email: string;
  role: string;
  tenant_id: number;
  is_admin: boolean;
};

export type Task = {
  id: number;
  tenant_id: number;
  vendor_id: number;
  employee_id: number;
  distance_km: number;
  duration_minutes: number;
  date: string;
  extra_km: number;
  extra_hours: number;
  payload: Record<string, unknown>;
};

type TokenResponse = { access_token: string; token_type: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed");
  }

  return response.json();
}

export async function fetchDashboardSummary(token?: string) {
  return request<{ monthly_total: number; vendors: number; pending: number }>(
    "/dashboard/summary",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
}

export async function downloadVendorReport({
  vendorId,
  year,
  month,
  token,
}: {
  vendorId: number;
  year: number;
  month: number;
  token?: string;
}) {
  const query = new URLSearchParams({ year: `${year}`, month: `${month}` }).toString();
  const res = await fetch(`${API_BASE_URL}/reports/vendor/${vendorId}/monthly?${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error("Failed to download report");
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Login failed");
  }

  return response.json() as Promise<TokenResponse>;
}

export async function signup(payload: { email: string; password: string; tenantId: number; role: string }) {
  return request<TokenResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      tenant_id: payload.tenantId,
      role: payload.role,
    }),
  });
}

export async function fetchCurrentUser(token: string) {
  return request<User>("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchUsers(token: string) {
  return request<User[]>("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchTasks(token: string, userId?: number) {
  const params = userId ? `?user_id=${userId}` : "";
  return request<Task[]>(`/tasks${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
