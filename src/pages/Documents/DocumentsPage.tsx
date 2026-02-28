import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Document types
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_on: string;
  category: string;
}

// Dropdown options
type DocumentView = "my_documents" | "upload_document";

const DocumentsPage = () => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<DocumentView>("my_documents");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const documentOptions: { key: DocumentView; label: string; icon: string }[] = [
    { key: "my_documents", label: t("myDocuments"), icon: "📁" },
    { key: "upload_document", label: t("uploadDocument"), icon: "⬆️" },
  ];

  // Dummy document data
  const documents: Document[] = [
    {
      id: "DOC-001",
      name: "ID Card.pdf",
      type: "PDF",
      size: "2.4 MB",
      uploaded_on: "2024-01-15",
      category: "Identity",
    },
    {
      id: "DOC-002",
      name: "Resume.pdf",
      type: "PDF",
      size: "1.8 MB",
      uploaded_on: "2024-01-10",
      category: "Career",
    },
    {
      id: "DOC-003",
      name: "Certificate.pdf",
      type: "PDF",
      size: "3.2 MB",
      uploaded_on: "2024-01-05",
      category: "Education",
    },
    {
      id: "DOC-004",
      name: "Photo.jpg",
      type: "Image",
      size: "450 KB",
      uploaded_on: "2024-01-01",
      category: "Personal",
    },
  ];

  const typeIcons: Record<string, string> = {
    PDF: "📄",
    Image: "🖼️",
    Word: "📝",
    Excel: "📊",
  };

  // Calculate stats
  const totalDocs = documents.length;
  const pdfDocs = documents.filter(d => d.type === "PDF").length;
  const imageDocs = documents.filter(d => d.type === "Image").length;
  const categories = [...new Set(documents.map(d => d.category))].length;

  // Dashboard stats cards
  const statsCards = [
    { label: t("totalFiles"), value: totalDocs, icon: "📁", color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("pdfs"), value: pdfDocs, icon: "📄", color: "bg-red-50", textColor: "text-red-600" },
    { label: t("images"), value: imageDocs, icon: "🖼️", color: "bg-green-50", textColor: "text-green-600" },
    { label: t("categories"), value: categories, icon: "📂", color: "bg-blue-50", textColor: "text-blue-600" },
  ];

  const currentOption = documentOptions.find((opt) => opt.key === activeView);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("documents")}</h1>
          <span className="text-sm text-gray-500">{totalDocs} {t("files")}</span>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-2xl p-4 text-center`}
            >
              <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentOption?.icon}</span>
            <span className="font-semibold text-gray-800">{currentOption?.label}</span>
          </div>
          <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
              >
                {documentOptions.map((option) => (
                  <li key={option.key}>
                    <button
                      onClick={() => {
                        setActiveView(option.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === option.key ? "bg-indigo-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* My Documents View */}
      {activeView === "my_documents" && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noDocumentsFound")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      {typeIcons[doc.type] || "📄"}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-indigo-600">
                        <span>👁️</span>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600">
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Document View */}
      {activeView === "upload_document" && (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 mb-4">{t("uploadNewDocument")}</h2>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <span className="text-4xl">📁</span>
            <p className="mt-2 text-gray-600">{t("dragAndDrop")}</p>
            <p className="text-sm text-gray-400">{t("or")}</p>
            <button className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg font-medium hover:bg-indigo-200">
              {t("browseFiles")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("documentName")}</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterDocumentName")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("category")}</label>
            <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
              <option>Identity</option>
              <option>Career</option>
              <option>Education</option>
              <option>Personal</option>
              <option>Other</option>
            </select>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            {t("uploadDocumentButton")}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
