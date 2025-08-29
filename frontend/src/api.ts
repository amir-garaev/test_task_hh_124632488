const API_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

export function setToken(t?: string) {
  if (!t) localStorage.removeItem("token");
  else localStorage.setItem("token", t);
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T = unknown>(
  path: string,
  opts: { method?: HttpMethod; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.detail ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("application/json") ? res.json() : res.text()) as Promise<T>;
}
