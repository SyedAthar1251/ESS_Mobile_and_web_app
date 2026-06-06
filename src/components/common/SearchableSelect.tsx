import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  searchText?: string;
}

interface SearchableSelectProps {
  label?: string;
  required?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  value: string;
  displayValue?: string;
  options: SearchableSelectOption[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
  triggerClassName?: string;
  emptyMessage?: string;
  variant?: "card" | "form";
  leadingIcon?: React.ReactNode;
}

const SearchableSelect = ({
  label,
  required,
  placeholder,
  searchPlaceholder = "Search...",
  value,
  displayValue,
  options,
  isOpen,
  onOpenChange,
  onSelect,
  triggerClassName,
  emptyMessage = "No results found",
  variant = "form",
  leadingIcon,
}: SearchableSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      return;
    }
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const haystack = (opt.searchText || `${opt.label} ${opt.value} ${opt.sublabel || ""}`).toLowerCase();
      return haystack.includes(q);
    });
  }, [options, searchQuery]);

  const defaultTriggerClass =
    variant === "card"
      ? "w-full p-4 flex items-center justify-between"
      : "w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between";

  const handleSelect = (optValue: string) => {
    onSelect(optValue);
    onOpenChange(false);
  };

  return (
    <div className="relative w-full" data-dropdown>
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={triggerClassName || defaultTriggerClass}
      >
        <div className="flex items-center gap-3 min-w-0">
          {leadingIcon}
          <span className={`truncate ${value || displayValue ? "text-gray-800" : "text-gray-400"}`}>
            {displayValue || value || placeholder}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100 bg-gray-50/80">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="p-3 text-sm text-gray-400 text-center">{emptyMessage}</p>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between gap-2 ${
                      value === opt.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    <span className="text-sm truncate">{opt.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {opt.sublabel && (
                        <span className="text-xs text-gray-400">{opt.sublabel}</span>
                      )}
                      {value === opt.value && (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;
