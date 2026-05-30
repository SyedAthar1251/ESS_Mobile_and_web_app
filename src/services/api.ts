import { Capacitor } from "@capacitor/core";
import axios from "axios";

const axiosApi = axios.create({
  timeout: 30000,
});

const api = {
  async get<T>(url: string, options?: any): Promise<{ data: T; status: number }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const headers: Record<string, string> = {};
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        let data: T;
        if (options?.responseType === 'blob') {
          data = await response.blob() as unknown as T;
        } else if (options?.responseType === 'text') {
          data = await response.text() as unknown as T;
        } else {
          data = await response.json() as T;
        }
        return { data, status: response.status };
      } catch (error: any) {
        console.error("[API] GET Error:", error);
        throw new Error(`Network error: ${error.message}`);
      }
    } else {
      const result = await axiosApi.get(url, options);
      return { data: result.data as T, status: result.status };
    }
  },

  async post<T>(url: string, data?: any, options?: any): Promise<{ data: T; status: number }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const headers: Record<string, string> = {};
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }

        let body: BodyInit | undefined;
        if (data instanceof FormData) {
          body = data;
          delete headers['Content-Type'];
        } else if (data instanceof URLSearchParams) {
          body = data.toString();
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (typeof data === 'string') {
          body = data;
        } else {
          body = data ? JSON.stringify(data) : undefined;
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
        });

        if (!response.ok) {
          let errorData: any;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }
          console.error("[API] HTTP Error:", response.status, errorData);

          const errorMessage = errorData?.exception || errorData?.error || errorData?.message || `HTTP Error: ${response.status}`;
          throw new Error(errorMessage);
        }

        let responseData: T;
        if (options?.responseType === 'blob') {
          responseData = await response.blob() as unknown as T;
        } else if (options?.responseType === 'text') {
          responseData = await response.text() as unknown as T;
        } else {
          responseData = await response.json() as T;
        }
        return { data: responseData, status: response.status };
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('HTTP Error')) {
          throw error;
        }
        console.error("[API] POST Error:", error);
        throw new Error(`Network error: ${error.message}`);
      }
    } else {
      const result = await axiosApi.post(url, data, options);
      return { data: result.data as T, status: result.status };
    }
  },
};

export default api;
