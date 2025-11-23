const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  return response.json();
}
