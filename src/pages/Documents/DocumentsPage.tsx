import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  getEmployeeDocuments,
  getDocumentCategories,
  getDocumentTypes,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  downloadEmployeeDocument,
} from "../../services/documents.service";
import type { EmployeeDocument, DocumentCategory, DocumentType } from "../../types/documents";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getListItemCardClass,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PDF: { bg: "bg-red-100", text: "text-red-600" },
  DOC: { bg: "bg-blue-100", text: "text-blue-600" },
  DOCX: { bg: "bg-blue-100", text: "text-blue-600" },
  XLS: { bg: "bg-emerald-100", text: "text-emerald-600" },
  XLSX: { bg: "bg-emerald-100", text: "text-emerald-600" },
  CSV: { bg: "bg-emerald-100", text: "text-emerald-600" },
  JPG: { bg: "bg-purple-100", text: "text-purple-600" },
  JPEG: { bg: "bg-purple-100", text: "text-purple-600" },
  PNG: { bg: "bg-purple-100", text: "text-purple-600" },
  GIF: { bg: "bg-purple-100", text: "text-purple-600" },
  WEBP: { bg: "bg-purple-100", text: "text-purple-600" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Identity: { bg: "bg-violet-100", text: "text-violet-600" },
  Career: { bg: "bg-indigo-100", text: "text-indigo-600" },
  Education: { bg: "bg-sky-100", text: "text-sky-600" },
  Personal: { bg: "bg-emerald-100", text: "text-emerald-600" },
  Medical: { bg: "bg-rose-100", text: "text-rose-600" },
  Other: { bg: "bg-gray-100", text: "text-gray-600" },
};

type DocumentView = "my_documents" | "upload_document";

const DocumentsPage = () => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [activeView, setActiveView] = useState<DocumentView>("my_documents");
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await getEmployeeDocuments();
        setDocuments(response.data || []);
      } catch (err) {
        console.error("[DocumentsPage] Failed to fetch documents:", err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (showUploadSheet) {
      getDocumentCategories()
        .then((res) => setCategories(res.data || []))
        .catch(() => setCategories([]));
    }
  }, [showUploadSheet]);

  useEffect(() => {
    if (selectedCategory) {
      getDocumentTypes(selectedCategory)
        .then((res) => setTypes(res.data || []))
        .catch(() => setTypes([]));
    } else {
      setTypes([]);
      setSelectedType("");
    }
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
  };

  const getFileIcon = (fileName: string): string => {
    const ext = getFileExtension(fileName).toLowerCase();
    if (ext === "pdf") return "📄";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    return "📁";
  };

  const getFileTypeChipClass = (fileName: string): string => {
    const ext = getFileExtension(fileName);
    return FILE_TYPE_COLORS[ext]?.bg || "bg-gray-100";
  };

  const getCategoryChipClass = (category: string): string => {
    return CATEGORY_COLORS[category]?.bg || "bg-gray-100";
  };

  const getCategoryTextClass = (category: string): string => {
    return CATEGORY_COLORS[category]?.text || "text-gray-600";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormError("");
    }
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory || !selectedType) {
      setFormError("Please select a file, category, and document type.");
      return;
    }

    setUploading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_category", selectedCategory);
      formData.append("document_type", selectedType);

      await uploadEmployeeDocument(formData);

      setSelectedFile(null);
      setSelectedCategory("");
      setSelectedType("");
      setShowUploadSheet(false);

      const response = await getEmployeeDocuments();
      setDocuments(response.data || []);
    } catch (err: any) {
      setFormError(err.message || "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!previewDoc) return;
    try {
      await deleteEmployeeDocument(previewDoc.name);
      setDocuments((prev) => prev.filter((d) => d.name !== previewDoc.name));
      setPreviewDoc(null);
    } catch (err) {
      console.error("[DocumentsPage] Failed to delete:", err);
    }
  };

  const saveToCacheAndShare = async (blob: Blob, fileName: string, title: string, text: string) => {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      const base64 = await blobToBase64(blob);
      const result = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title, text, files: [result.uri] });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 1000);
    }
  };

  const handleDownload = async () => {
    if (!previewDoc) return;
    try {
      const blob = await downloadEmployeeDocument(previewDoc.name);
      await saveToCacheAndShare(blob, previewDoc.file_name, previewDoc.document_name || previewDoc.file_name, previewDoc.file_name);
    } catch (err) {
      console.error("[DocumentsPage] Failed to download:", err);
    }
  };

  const handleShare = async () => {
    if (!previewDoc) return;
    try {
      const blob = await downloadEmployeeDocument(previewDoc.name);
      await saveToCacheAndShare(blob, previewDoc.file_name, previewDoc.document_name || previewDoc.file_name, previewDoc.file_name);
    } catch (err) {
      console.error("[DocumentsPage] Failed to share:", err);
    }
  };

  const handleCardPress = async (doc: EmployeeDocument) => {
    setPreviewDoc(doc);
    setPreviewBlobUrl(null);
    setPreviewLoading(true);

    try {
      const ext = getFileExtension(doc.file_name).toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
        const blob = await downloadEmployeeDocument(doc.name);
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      }
    } catch (err) {
      console.error("[DocumentsPage] Failed to load preview:", err);
      setPreviewBlobUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const isPreviewable = (fileName: string): boolean => {
    const ext = getFileExtension(fileName).toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  };

  const CardComponent = ({ doc, onPreviewPress }: { doc: EmployeeDocument; onPreviewPress: (doc: EmployeeDocument) => void }) => {
    return (
      <motion.div
        onClick={() => onPreviewPress(doc)}
        className={getListItemCardClass(theme)}
        style={{ cursor: "pointer" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${getFileTypeChipClass(doc.file_name)}`}>
            {getFileIcon(doc.file_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate" style={{ color: themeColors.text }}>{doc.file_name}</h4>
            <div className="flex items-center gap-2 text-sm flex-wrap mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryChipClass(doc.document_category)} ${getCategoryTextClass(doc.document_category)}`}>
                {doc.document_category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getFileTypeChipClass(doc.file_name)} ${FILE_TYPE_COLORS[getFileExtension(doc.file_name)]?.text || "text-gray-600"}`}>
                {getFileExtension(doc.file_name)}
              </span>
              <span className="text-gray-400 text-xs">{formatDate(doc.creation)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: themeColors.textSecondary }}>{t("documents")}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: themeColors.textSecondary }}>{documents.length} {t("files")}</span>
          <button
            onClick={() => setShowUploadSheet(true)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            {t("uploadDocument") || "Upload Document"}
          </button>
        </div>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className={`${getListItemCardClass(theme)} p-4`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${getPageCardStyle(theme)}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-40 rounded ${getPageCardStyle(theme)}`} />
                  <div className="flex gap-2">
                    <div className={`h-5 w-16 rounded-full ${getPageCardStyle(theme)}`} />
                    <div className={`h-5 w-12 rounded-full ${getPageCardStyle(theme)}`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${getPageCardStyle(theme)} p-8 text-center`}
        >
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.textSecondary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-800 font-semibold text-lg">No documents uploaded</p>
          <p className="text-sm mt-1 mb-6" style={{ color: themeColors.textSecondary }}>
            Upload your first document to get started.
          </p>
          <button
            onClick={() => setShowUploadSheet(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {t("uploadDocument") || "Upload Document"}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <CardComponent
              key={doc.name}
              doc={doc}
              onPreviewPress={handleCardPress}
            />
          ))}
        </div>
      )}

      {/* Upload Bottom Sheet */}
      <AnimatePresence>
        {showUploadSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => { if (!uploading) setShowUploadSheet(false); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Upload Document</h3>
                <button
                  onClick={() => { if (!uploading) setShowUploadSheet(false); }}
                  disabled={uploading}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
                {/* Upload Zone */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
                  />

                  {selectedFile ? (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-3xl ${getFileTypeChipClass(selectedFile.name)}`}>
                        {getFileIcon(selectedFile.name)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="text-xs text-red-500 font-medium mt-1 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-3 font-semibold text-gray-700">Drop file here or tap to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, Images up to 10 MB</p>
                    </>
                  )}
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Category <span className="text-red-400">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {categories.length === 0
                      ? ["Identity", "Career", "Education", "Personal", "Medical", "Other"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCategory === cat
                                ? `${CATEGORY_COLORS[cat]?.bg || "bg-gray-100"} ${CATEGORY_COLORS[cat]?.text || "text-gray-600"} ring-2 ring-offset-2 ring-indigo-400`
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))
                      : categories.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.label)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCategory === cat.label
                                ? `${CATEGORY_COLORS[cat.label]?.bg || "bg-gray-100"} ${CATEGORY_COLORS[cat.label]?.text || "text-gray-600"} ring-2 ring-offset-2 ring-indigo-400`
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                  </div>
                </div>

                {/* Document Type Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Document Type <span className="text-red-400">*</span></label>
                  {types.length === 0 ? (
                    <p className="text-sm text-gray-400">Select a category first</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {types.map((tp) => (
                        <button
                          key={tp.value}
                          onClick={() => setSelectedType(tp.label)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedType === tp.label
                              ? "bg-indigo-100 text-indigo-700 ring-2 ring-offset-2 ring-indigo-400"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {tp.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Error */}
                {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
              </div>

              {/* Upload Button */}
              <div className="px-5 pb-6 pt-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !selectedCategory || !selectedType}
                  className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>Upload Document</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Document Preview Bottom Sheet */}
      <AnimatePresence>
        {previewDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPreviewDoc(null);
                if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                setPreviewBlobUrl(null);
              }}
              className="fixed inset-0 bg-black/60 z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[92vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-base font-bold text-gray-800 truncate">{previewDoc.document_name || previewDoc.file_name}</h3>
                  <p className="text-xs text-gray-500 truncate">{previewDoc.file_name} • {formatDate(previewDoc.creation)}</p>
                </div>
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {previewLoading ? (
                  <div className={`rounded-2xl flex items-center justify-center ${getPageCardStyle(theme)}`} style={{ minHeight: "280px" }}>
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : previewBlobUrl ? (
                  <div className={`rounded-2xl overflow-hidden flex items-center justify-center ${getPageCardStyle(theme)}`} style={{ minHeight: "280px" }}>
                    <img
                      src={previewBlobUrl}
                      alt={previewDoc.file_name}
                      className="max-w-full max-h-[55vh] object-contain"
                    />
                  </div>
                ) : (
                  <div className={`rounded-2xl flex flex-col items-center justify-center p-8 ${getPageCardStyle(theme)}`} style={{ minHeight: "280px" }}>
                    <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-4xl mb-4 ${getFileTypeChipClass(previewDoc.file_name)}`}>
                      {getFileIcon(previewDoc.file_name)}
                    </div>
                    <p className="font-semibold text-gray-800 text-center">{previewDoc.file_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{previewDoc.document_category} • {previewDoc.document_type}</p>
                    <p className="text-xs text-gray-400 mt-2">Tap Download to view or share this file</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-6 pt-2 flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 111.184 5.656M15.316 7.344a3 3 0 010 5.656" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleDeleteCard}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentsPage;
