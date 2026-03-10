import { Capacitor } from "@capacitor/core";
import axios from "axios";

// Create axios instance for web
const axiosApi = axios.create({
  timeout: 30000,
});

// Wrapper that works for both web and mobile
const api = {
  async get<T>(url: string, options?: any): Promise<{ data: T; status: number }> {
    if (Capacitor.isNativePlatform()) {
      // Use native fetch for mobile - more reliable for CORS
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
        } else {
          data = await response.json() as T;
        }
        return { data, status: response.status };
      } catch (error: any) {
        throw new Error(`Network error: ${error.message}`);
      }
    } else {
      // Use axios for web
      const result = await axiosApi.get(url, options);
      return { data: result.data as T, status: result.status };
    }
  },

  async post<T>(url: string, data?: any, options?: any): Promise<{ data: T; status: number }> {
    if (Capacitor.isNativePlatform()) {
      // Use native fetch for mobile
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
        
        let responseData: T;
        if (options?.responseType === 'blob') {
          responseData = await response.blob() as unknown as T;
        } else {
          responseData = await response.json() as T;
        }
        return { data: responseData, status: response.status };
      } catch (error: any) {
        throw new Error(`Network error: ${error.message}`);
      }
    } else {
      // Use axios for web
      const result = await axiosApi.post(url, data, options);
      return { data: result.data as T, status: result.status };
    }
  },
};

export default api;
