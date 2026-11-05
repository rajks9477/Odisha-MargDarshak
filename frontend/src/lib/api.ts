const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export interface ApiError {
  detail: string;
  status: number;
}

export class ApiClient {
  private static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ner_access_token");
  }

  private static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ner_refresh_token");
  }

  public static setTokens(access: string, refresh: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("ner_access_token", access);
      localStorage.setItem("ner_refresh_token", refresh);
    }
  }

  public static clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ner_access_token");
      localStorage.removeItem("ner_refresh_token");
      localStorage.removeItem("ner_user_cache");
    }
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getAccessToken();
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw {
        detail: "Cannot connect to Odisha MargDarshak backend server. Please verify the backend is running.",
        status: 503
      } as ApiError;
    }

    // Handle 401 Unauthorized token refresh
    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            this.setTokens(data.access_token, refreshToken);
            // Retry original request with new token
            headers["Authorization"] = `Bearer ${data.access_token}`;
            const retryRes = await fetch(url, { ...options, headers });
            if (retryRes.ok) {
              return await retryRes.json();
            }
          }
        } catch {
          this.clearTokens();
        }
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText || "An unexpected error occurred" };
      }

      throw {
        detail: errorData.detail || "Request failed",
        status: response.status
      } as ApiError;
    }

    return await response.json();
  }

  // Convenience helper methods
  public static get<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public static post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  public static put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  public static delete<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}
