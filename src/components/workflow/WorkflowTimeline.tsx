import { motion } from "framer-motion";

export interface TimelineItem {
  state: string;
  status: "completed" | "current" | "pending";
  action_by?: string | null;
  action_at?: string | null;
}

export interface WorkflowTimelineData {
  success: boolean;
  has_workflow: boolean;
  workflow_name?: string;
  current_state?: string;
  current_status?: string;
  timeline?: TimelineItem[];
  pending_roles?: string[];
  is_final_state?: boolean;
}

interface WorkflowTimelineProps {
  data: WorkflowTimelineData | null;
  loading?: boolean;
  documentStatus?: string;
  labels?: {
    completed?: string;
    inProgress?: string;
    waiting?: string;
    waitingFor?: string;
  };
}

const TERMINAL_STATUSES = ["approved", "rejected", "cancelled", "closed"];

const isTerminalStatus = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();
  return TERMINAL_STATUSES.some((t) => s === t || s.includes(t));
};

const isPendingStatus = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "open" || s === "pending" || s.includes("pending") || s.includes("open");
};

const statesMatch = (a: string, b: string): boolean => {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left === right || left.includes(right) || right.includes(left);
};

const normalizeTimelineItems = (
  items: TimelineItem[],
  data: WorkflowTimelineData,
  documentStatus?: string,
): TimelineItem[] => {
  if (items.length === 0) return items;

  const effectiveStatus = data.current_status || documentStatus || null;
  const { current_state, is_final_state, pending_roles } = data;
  let normalized = items.map((item) => ({ ...item }));

  let currentIdx = normalized.findIndex((item) => item.status === "current");

  if (currentIdx === -1 && current_state) {
    currentIdx = normalized.findIndex((item) => statesMatch(item.state, current_state));
  }

  if (currentIdx === -1) {
    currentIdx = normalized.findIndex((item) => item.status === "pending");
  }

  if (currentIdx === -1 && effectiveStatus && isPendingStatus(effectiveStatus)) {
    const matchIdx = normalized.findIndex((item) => statesMatch(item.state, effectiveStatus));
    if (matchIdx > -1) {
      currentIdx = matchIdx;
    } else {
      const lastActionIdx = normalized.reduce(
        (last, item, idx) => (item.action_by || item.action_at ? idx : last),
        -1,
      );
      if (lastActionIdx > -1 && lastActionIdx < normalized.length - 1) {
        currentIdx = lastActionIdx + 1;
      } else if (pending_roles && pending_roles.length > 0) {
        const withoutActionIdx = normalized.findIndex((item) => !item.action_by && !item.action_at);
        currentIdx = withoutActionIdx > -1 ? withoutActionIdx : normalized.length - 1;
      } else {
        currentIdx = normalized.length - 1;
      }
    }
  }

  if (currentIdx === -1 && is_final_state && isTerminalStatus(effectiveStatus)) {
    const matchIdx = normalized.findIndex(
      (item) => effectiveStatus && statesMatch(item.state, effectiveStatus),
    );
    currentIdx = matchIdx > -1 ? matchIdx : normalized.length - 1;
  }

  const actuallyFinal = Boolean(is_final_state && isTerminalStatus(effectiveStatus));

  if (currentIdx === -1) {
    return normalized;
  }

  return normalized.map((item, idx) => {
    if (idx < currentIdx) {
      return { ...item, status: "completed" as const };
    }
    if (idx === currentIdx) {
      return { ...item, status: actuallyFinal ? ("completed" as const) : ("current" as const) };
    }
    return { ...item, status: "pending" as const };
  });
};

export default function WorkflowTimeline({ data, loading, documentStatus, labels }: WorkflowTimelineProps) {
  const l = {
    completed: labels?.completed || "Completed",
    inProgress: labels?.inProgress || "In Progress",
    waiting: labels?.waiting || "Waiting",
    waitingFor: labels?.waitingFor || "Waiting For:",
  };
  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || !data.success) return null;

  const { has_workflow, current_state, current_status, timeline, pending_roles } = data;
  const effectiveStatus = current_status || documentStatus || null;

  let items: TimelineItem[] = [];

  if (has_workflow && timeline && timeline.length > 0) {
    items = normalizeTimelineItems(timeline, data, documentStatus);
  } else {
    const terminal = isTerminalStatus(effectiveStatus);
    items = [
      { state: "Created", status: "completed" },
      {
        state: current_state || current_status || "Unknown",
        status: terminal ? "completed" : "current",
      },
    ];
  }

  const currentState = items.find((i) => i.status === "current");
  const pendingRoles = pending_roles || [];

  return (
    <div className="w-full overflow-hidden">
      <div className="relative">
        {items.map((item, index) => {
          const isLeft = index % 2 === 0;
          const isCompleted = item.status === "completed";
          const isCurrent = item.status === "current";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative flex items-start"
              style={{ minHeight: 72 }}
            >
              {/* Left column content */}
              <div className="w-[calc(50%-18px)] flex-shrink-0">
                {isLeft && (
                  <div className="pr-3 text-right">
                    <TimelineCard item={item} isCompleted={isCompleted} isCurrent={isCurrent} labels={l} />
                    {isCurrent && pendingRoles.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2 text-right">
                        <div className="inline-block rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-left">
                          <p className="text-xs font-medium text-amber-700">{l.waitingFor}</p>
                          {pendingRoles.map((role, i) => (
                            <p key={i} className="text-xs text-amber-600 mt-0.5">{role}</p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Center dot + line */}
              <div className="w-[36px] flex-shrink-0 flex flex-col items-center relative z-10">
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0.4)", "0 0 0 8px rgba(99,102,241,0)", "0 0 0 0 rgba(99,102,241,0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-md"
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white shadow-sm" />
                )}
                {/* Line segment below dot (not on last item) */}
                {index < items.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[20px] ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>

              {/* Right column content */}
              <div className="w-[calc(50%-18px)] flex-shrink-0">
                {!isLeft && (
                  <div className="pl-3 text-left">
                    <TimelineCard item={item} isCompleted={isCompleted} isCurrent={isCurrent} labels={l} />
                    {isCurrent && pendingRoles.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2">
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <p className="text-xs font-medium text-amber-700">{l.waitingFor}</p>
                          {pendingRoles.map((role, i) => (
                            <p key={i} className="text-xs text-amber-600 mt-0.5">{role}</p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({
  item,
  isCompleted,
  isCurrent,
  labels,
}: {
  item: TimelineItem;
  isCompleted: boolean;
  isCurrent: boolean;
  labels: { completed: string; inProgress: string; waiting: string; waitingFor: string };
}) {
  return (
    <div className={`rounded-xl px-3 py-2.5 border ${
      isCompleted ? "bg-green-50 border-green-200" :
      isCurrent ? "bg-indigo-50 border-indigo-200" :
      "bg-gray-50 border-gray-200"
    }`}>
      <p className={`text-sm font-medium leading-tight ${
        isCompleted ? "text-green-800" :
        isCurrent ? "text-indigo-800" :
        "text-gray-500"
      }`}>
        {item.state}
      </p>
      <p className={`text-xs mt-0.5 ${
        isCompleted ? "text-green-600" :
        isCurrent ? "text-indigo-600" :
        "text-gray-400"
      }`}>
                    {isCompleted ? labels.completed : isCurrent ? labels.inProgress : labels.waiting}
      </p>
      {item.action_by && (
        <p className="text-xs text-gray-500 mt-1">By: {item.action_by}</p>
      )}
      {item.action_at && (
        <p className="text-xs text-gray-400 mt-0.5">{item.action_at}</p>
      )}
    </div>
  );
}
