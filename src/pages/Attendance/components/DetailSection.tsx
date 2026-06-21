import { ReactNode } from "react";

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const DetailSection = ({ title, children, className }: DetailSectionProps) => {
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value: string | number | null | undefined;
}

export const DetailRow = ({ label, value }: DetailRowProps) => {
  return (
    <div className="flex justify-between">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs font-medium text-gray-800">
        {value ?? "-"}
      </p>
    </div>
  );
};

export default DetailSection;