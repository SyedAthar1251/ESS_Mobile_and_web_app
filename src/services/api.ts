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
      // Use native fetch for mobile - simpler and more reliable
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
        console.error("[API] GET Error:", error);
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
        const headers: Record<string, string> = {};
        if (options?.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }
        
        // Determine body content - don't stringify form-urlencoded data
        let body: string | undefined;
        const contentType = headers['Content-Type'] || headers['content-type'] || '';
        
        if (contentType.includes('application/x-www-form-urlencoded')) {
          // Don't stringify form data - send as-is
          body = data;
        } else {
          // Default to JSON
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
        
        // Check for HTTP errors
        if (!response.ok) {
          let errorData: any;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }
          console.error("[API] HTTP Error:", response.status, errorData);
          
          // Throw error with server message if available
          const errorMessage = errorData?.exception || errorData?.error || errorData?.message || `HTTP Error: ${response.status}`;
          throw new Error(errorMessage);
        }
        
        let responseData: T;
        if (options?.responseType === 'blob') {
          responseData = await response.blob() as unknown as T;
        } else {
          responseData = await response.json() as T;
        }
        return { data: responseData, status: response.status };
      } catch (error: any) {
        // Re-throw if it's already an Error object from above
        if (error instanceof Error && error.message.includes('HTTP Error')) {
          throw error;
        }
        console.error("[API] POST Error:", error);
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
