const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('gutech_lms_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('gutech_lms_token', token);
    } else {
      sessionStorage.removeItem('gutech_lms_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem('gutech_lms_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      this.setToken(null);
      sessionStorage.removeItem('gutech_lms_user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }

    let payload: any;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      payload = await res.json();
    } else if (contentType && (contentType.includes('text/csv') || contentType.includes('text/plain'))) {
      const text = await res.text();
      return text as unknown as T;
    } else {
      payload = await res.text();
    }

    if (!res.ok) {
      const error: ApiError = payload?.error || {
        code: 'HTTP_ERROR',
        message: payload?.message || `Request failed with status ${res.status}`,
      };
      throw error;
    }

    return (payload?.data !== undefined ? payload.data : payload) as T;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
