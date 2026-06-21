import { AttendanceRequestListItem } from "../../../types/attendanceRequest";
import StatusChip from "./StatusChip";

interface RequestCardProps {
  request: AttendanceRequestListItem;
  onClick: () => void;
}

const RequestCard = ({ request, onClick }: RequestCardProps) => {
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr: string) => {
    return parseDate(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCreationDate = (dateStr: string) => {
    return parseDate(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-800 text-sm">{request.reason || "No Reason"}</h3>
        <StatusChip status="" docstatus={request.docstatus} />
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          {formatDate(request.from_date)} – {formatDate(request.to_date)}
        </p>
        
        {request.shift && (
          <p className="text-xs text-gray-400">Shift: {request.shift}</p>
        )}
        
        <p className="text-xs text-gray-400">Created: {formatCreationDate(request.creation)}</p>
      </div>
    </div>
  );
};

export default RequestCard;