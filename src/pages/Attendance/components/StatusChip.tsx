import { ReactNode } from "react";

interface StatusChipProps {
  status: string;
  docstatus?: number;
}

const StatusChip = ({ status, docstatus }: StatusChipProps) => {
  const getStatusInfo = () => {
    if (docstatus !== undefined) {
      switch (docstatus) {
        case 0:
          return { label: "Draft", bg: "bg-gray-100", text: "text-gray-700" };
        case 1:
          return { label: "Approved", bg: "bg-green-100", text: "text-green-700" };
        case 2:
          return { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" };
        default:
          return { label: "Unknown", bg: "bg-gray-100", text: "text-gray-700" };
      }
    }
    
    const s = status?.toLowerCase() || "";
    if (s === "approved") return { label: "Approved", bg: "bg-green-100", text: "text-green-700" };
    if (s === "cancelled") return { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" };
    return { label: "Draft", bg: "bg-gray-100", text: "text-gray-700" };
  };

  const { label, bg, text } = getStatusInfo();

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default StatusChip;