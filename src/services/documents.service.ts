import api from "./api";
import type {
  DocumentCategory,
  DocumentCategoryListResponse,
  DocumentType,
  DocumentTypeListResponse,
  EmployeeDocument,
  EmployeeDocumentListResponse,
  UploadDocumentResponse,
} from "../types/documents";

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => {
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

const getMobileError = (error: any): { message: string; status: number } => {
  if (error?.response?.status) {
    return {
      message: error.response?.data?.exception || error.response?.data?.message || error.message || "Request failed",
      status: error.response.status,
    };
  }
  return {
    message: error?.message || "Network error",
    status: error?.status || 0,
  };
};

const BASE_URL = "/api/method/employee_self_service.mobile.documents";

const mapCategories = (raw: any[]): DocumentCategory[] =>
  raw.map((item: any) => ({
    value: item.name,
    label: item.category_name || item.name,
  }));

const mapTypes = (raw: any[]): DocumentType[] =>
  raw.map((item: any) => ({
    value: item.name,
    label: item.document_type_name || item.name,
  }));

export const getDocumentCategories = async (): Promise<DocumentCategoryListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.get_document_categories`;

  try {
    const response = await api.get<{ message: string; data: any[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return {
      message: response.data.message,
      data: mapCategories(response.data.data),
    };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch document categories");
  }
};

export const getDocumentTypes = async (documentCategory: string): Promise<DocumentTypeListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.get_document_types?document_category=${encodeURIComponent(documentCategory)}`;

  try {
    const response = await api.get<{ message: string; data: any[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return {
      message: response.data.message,
      data: mapTypes(response.data.data),
    };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch document types");
  }
};

export const getEmployeeDocuments = async (): Promise<EmployeeDocumentListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.get_employee_documents`;

  try {
    const response = await api.get<EmployeeDocumentListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data;
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch employee documents");
  }
};

export const uploadEmployeeDocument = async (formData: FormData): Promise<UploadDocumentResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.upload_employee_document`;

  try {
    const response = await api.post<UploadDocumentResponse>(apiUrl, formData, {
      headers: {
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data;
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to upload document");
  }
};

export const downloadEmployeeDocument = async (documentId: string): Promise<Blob> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.download_employee_document?document_id=${encodeURIComponent(documentId)}`;

  try {
    const response = await api.get<Blob>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to download document");
  }
};

export const deleteEmployeeDocument = async (documentId: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}${BASE_URL}.delete_employee_document`;

  try {
    const response = await api.post<{ message: string }>(
      apiUrl,
      { document_id: documentId },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return { message: response.data?.message || "Document deleted successfully" };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to delete document");
  }
};
