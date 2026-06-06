import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { createTravelRequest, CreateTravelRequest } from "../../services/travelService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface CreateTravelScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CreateTravelScreen = ({ onBack, onSuccess }: CreateTravelScreenProps) => {
  const { t } = useLanguage();
  const { theme, themeColors } = useTheme();

  const [formData, setFormData] = useState<CreateTravelRequest>({
    purpose: "",
    travel_type: "Domestic",
    from_date: "",
    to_date: "",
    from_location: "",
    to_location: "",
    destination: "",
    estimated_expense: 0,
    advance_required: false,
    advance_amount: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDays = () => {
    if (formData.from_date && formData.to_date) {
      const start = new Date(formData.from_date);
      const end = new Date(formData.to_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.purpose.trim()) {
      setError(t("purposeRequired") || "Purpose is required");
      return;
    }
    if (!formData.travel_type) {
      setError(t("travelTypeRequired") || "Travel type is required");
      return;
    }
    if (!formData.from_date) {
      setError(t("fromDateRequired") || "From date is required");
      return;
    }
    if (!formData.to_date) {
      setError(t("toDateRequired") || "To date is required");
      return;
    }
    if (formData.to_date < formData.from_date) {
      setError(t("toDateError") || "To date cannot be before from date");
      return;
    }
    if (!formData.destination.trim()) {
      setError(t("destinationRequired") || "Destination is required");
      return;
    }

    try {
      setSubmitting(true);
      await createTravelRequest(formData);
      onSuccess();
    } catch (err: any) {
      console.error("[CreateTravelScreen] Submit error:", err);
      setError(err.message || t("submitError") || "Failed to submit travel request");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const dateInputClass = `${inputClass} text-gray-900 [color-scheme:light]`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("applyTravel") || "Apply Travel"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`${getPageCardStyle(theme)} p-6 space-y-4`}>
          <div>
            <label className={labelClass}>
              {t("travelPurpose") || "Purpose"} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder={t("enterPurpose") || "Enter travel purpose"}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("travelType") || "Travel Type"} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, travel_type: "Domestic" })}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  formData.travel_type === "Domestic"
                    ? "text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={formData.travel_type === "Domestic" ? { backgroundColor: themeColors.primary } : {}}
              >
                {t("domestic") || "Domestic"}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, travel_type: "International" })}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  formData.travel_type === "International"
                    ? "text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={formData.travel_type === "International" ? { backgroundColor: themeColors.primary } : {}}
              >
                {t("international") || "International"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("fromDate") || "From Date"} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.from_date}
                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                className={dateInputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("toDate") || "To Date"} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                className={dateInputClass}
                required
              />
            </div>
          </div>

          {formData.from_date && formData.to_date && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {t("numberOfDays") || "Number of Days"}: <span className="font-bold">{calculateDays()}</span> {t("days") || "days"}
              </p>
            </div>
          )}

          <div>
            <label className={labelClass}>
              {t("destination") || "Destination"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className={inputClass}
              placeholder={t("enterDestination") || "Enter destination"}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("fromLocation") || "From Location"}</label>
              <input
                type="text"
                value={formData.from_location}
                onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                className={inputClass}
                placeholder={t("enterFromLocation") || "Enter from location"}
              />
            </div>
            <div>
              <label className={labelClass}>{t("toLocation") || "To Location"}</label>
              <input
                type="text"
                value={formData.to_location}
                onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                className={inputClass}
                placeholder={t("enterToLocation") || "Enter to location"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("estimatedExpense") || "Estimated Expense (SAR)"}</label>
            <input
              type="number"
              value={formData.estimated_expense || ""}
              onChange={(e) => setFormData({ ...formData, estimated_expense: Number(e.target.value) })}
              className={inputClass}
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-6 text-black rounded-xl font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: themeColors.primary }}
        >
          {submitting ? (t("submitting") || "Submitting...") : (t("submitRequest") || "Submit Request")}
        </button>
      </form>
    </div>
  );
};

export default CreateTravelScreen;
