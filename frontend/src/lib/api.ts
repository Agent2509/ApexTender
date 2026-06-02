const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

type GetTokenFn = () => Promise<string | null>;

class ApiClient {
  private getToken: GetTokenFn | null = null;

  setTokenProvider(fn: GetTokenFn) {
    this.getToken = fn;
  }

  private async headers(extra?: Record<string, string>): Promise<Record<string, string>> {
    const token = this.getToken ? await this.getToken() : null;
    return {
      Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
      ...extra,
    };
  }

  async get<T = any>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: await this.headers(),
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    const hdrs = await this.headers(
      isFormData ? undefined : { "Content-Type": "application/json" }
    );
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: hdrs,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }

  async delete<T = any>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: await this.headers(),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  }

  async poll<T = any>(
    path: string,
    options: {
      interval?: number;
      maxAttempts?: number;
      isComplete?: (data: T) => boolean;
    } = {}
  ): Promise<T> {
    const { interval = 2000, maxAttempts = 60, isComplete } = options;
    const defaultIsComplete = (data: any) =>
      data?.status === "SUCCESS" || data?.status === "FAILURE" || data?.status === "ready";

    let attempts = 0;
    while (attempts < maxAttempts) {
      const data = await this.get<T>(path);
      if ((isComplete || defaultIsComplete)(data)) {
        return data;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }
    throw new Error(`Polling timed out after ${maxAttempts} attempts`);
  }
}

export const apiClient = new ApiClient();
