/* --- Raw API response interfaces (exact shape from Frappe) --- */
export interface DocumentCategoryApi {
  name: string;
  category_name: string;
}

export interface DocumentTypeApi {
  name: string;
  document_type_name: string;
}

/* --- Service return types (already mapped to { value, label }) --- */
export interface DocumentCategory {
  value: string;
  label: string;
}

export interface DocumentCategoryListResponse {
  message: string;
  data: DocumentCategory[];
}

export interface DocumentType {
  value: string;
  label: string;
}

export interface DocumentTypeListResponse {
  message: string;
  data: DocumentType[];
}

export interface EmployeeDocument {
  name: string;
  document_category: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_name: string;
  file_extension: string;
  creation: string;
}

export interface EmployeeDocumentListResponse {
  message: string;
  data: EmployeeDocument[];
}

export interface UploadDocumentResponse {
  message: string;
  data: {
    name: string;
    document_category: string;
    document_type: string;
    document_name: string;
    file_url: string;
  };
}

export interface DownloadDocumentResponse {
  message: string;
  data: {
    document_id: string;
    document_name: string;
    file_name: string;
    file_url: string;
  };
}
