export class CodexClient {
  protected readonly baseUrl: string;
  constructor(baseUrl = import.meta.env.VITE_CODEX_API_URL ?? "/api") { this.baseUrl = baseUrl.replace(/\/$/, ""); }
  protected async request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${this.baseUrl}${path}`, { headers: { Accept: "application/json", ...init?.headers }, ...init }); if (!response.ok) throw new Error(`Codex API request failed (${response.status})`); return response.status === 204 ? undefined as T : response.json() as Promise<T>; }
}
