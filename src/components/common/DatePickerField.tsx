import { forwardRef } from "react";

interface DatePickerFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}

const DatePickerField = forwardRef<HTMLInputElement, DatePickerFieldProps>(({
  label,
  required,
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
}, ref) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-full p-3 pr-10 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          onClick={(e) => {
            (e.target as HTMLInputElement).showPicker();
          }}
        />
        <svg 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
});

DatePickerField.displayName = "DatePickerField";

export default DatePickerField;