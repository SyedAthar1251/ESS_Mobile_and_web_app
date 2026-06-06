import { motion } from "framer-motion";

type StepStatus = "completed" | "current" | "pending" | "rejected";

interface FlowStep {
  role: string;
  name: string;
  statusLabel: string;
  stepStatus: StepStatus;
  date?: string;
}

interface LeaveApprovalFlowProps {
  createdBy: string;
  approverName: string;
  documentStatus: string;
  createdAt?: string;
  loading?: boolean;
  labels: {
    createdBy: string;
    leaveApprover: string;
    completed: string;
    pending: string;
    approved: string;
    rejected: string;
  };
}

const isOpenStatus = (status: string) => {
  const s = status.toLowerCase();
  return s === "open" || s === "pending" || s.includes("pending") || s.includes("open");
};

const isApprovedStatus = (status: string) => status.toLowerCase().includes("approved");

const isRejectedStatus = (status: string) => status.toLowerCase().includes("rejected");

const buildSteps = (
  createdBy: string,
  approverName: string,
  documentStatus: string,
  createdAt: string | undefined,
  labels: LeaveApprovalFlowProps["labels"],
): FlowStep[] => {
  const approverStatusLabel = isApprovedStatus(documentStatus)
    ? labels.approved
    : isRejectedStatus(documentStatus)
    ? labels.rejected
    : labels.pending;

  const approverStepStatus: StepStatus = isApprovedStatus(documentStatus)
    ? "completed"
    : isRejectedStatus(documentStatus)
    ? "rejected"
    : isOpenStatus(documentStatus)
    ? "current"
    : "pending";

  return [
    {
      role: labels.createdBy,
      name: createdBy,
      statusLabel: labels.completed,
      stepStatus: "completed",
      date: createdAt,
    },
    {
      role: labels.leaveApprover,
      name: approverName || "-",
      statusLabel: approverStatusLabel,
      stepStatus: approverStepStatus,
    },
  ];
};

const FlowSkeleton = () => (
  <div className="relative py-2">
    <div
      aria-hidden
      className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-200 z-0"
      style={{ top: 14, bottom: 14 }}
    />
    {[0, 1].map((index) => {
      const isLeft = index % 2 === 0;
      return (
        <div key={index} className="relative flex items-start" style={{ minHeight: 88 }}>
          <div className="w-[calc(50%-18px)] flex-shrink-0">
            {isLeft && (
              <div className="pr-3 flex justify-end">
                <div className="w-full max-w-[180px] rounded-xl border border-gray-200 p-3 animate-pulse">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2 ml-auto" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1 ml-auto" />
                  <div className="h-3 w-14 bg-gray-200 rounded ml-auto" />
                </div>
              </div>
            )}
          </div>
          <div className="w-[36px] flex-shrink-0 flex items-start justify-center relative z-10">
            <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="w-[calc(50%-18px)] flex-shrink-0">
            {!isLeft && (
              <div className="pl-3">
                <div className="w-full max-w-[180px] rounded-xl border border-gray-200 p-3 animate-pulse">
                  <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

function StepCard({ step }: { step: FlowStep }) {
  const styles = {
    completed: {
      card: "bg-green-50 border-green-200",
      role: "text-green-700",
      name: "text-green-900",
      status: "text-green-600",
    },
    current: {
      card: "bg-indigo-50 border-indigo-200",
      role: "text-indigo-700",
      name: "text-indigo-900",
      status: "text-indigo-600",
    },
    pending: {
      card: "bg-gray-50 border-gray-200",
      role: "text-gray-500",
      name: "text-gray-700",
      status: "text-gray-400",
    },
    rejected: {
      card: "bg-red-50 border-red-200",
      role: "text-red-700",
      name: "text-red-900",
      status: "text-red-600",
    },
  }[step.stepStatus];

  return (
    <div className={`rounded-xl px-3 py-2.5 border ${styles.card}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${styles.role}`}>
        {step.role}
      </p>
      <p className={`text-sm font-medium leading-tight mt-1 ${styles.name}`}>
        {step.name}
      </p>
      <p className={`text-xs mt-1 font-medium ${styles.status}`}>
        {step.statusLabel}
      </p>
      {step.date && (
        <p className="text-xs text-gray-400 mt-1">{step.date}</p>
      )}
    </div>
  );
}

function StepDot({ stepStatus }: { stepStatus: StepStatus }) {
  return (
    <div className="w-[36px] flex-shrink-0 flex items-start justify-center relative z-10 pt-0">
      {stepStatus === "completed" ? (
        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-md">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : stepStatus === "current" ? (
        <motion.div
          animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0.4)", "0 0 0 8px rgba(99,102,241,0)", "0 0 0 0 rgba(99,102,241,0.4)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-md"
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </motion.div>
      ) : stepStatus === "rejected" ? (
        <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white shadow-sm" />
      )}
    </div>
  );
}

export default function LeaveApprovalFlow({
  createdBy,
  approverName,
  documentStatus,
  createdAt,
  loading,
  labels,
}: LeaveApprovalFlowProps) {
  if (loading) {
    return <FlowSkeleton />;
  }

  const steps = buildSteps(createdBy, approverName, documentStatus, createdAt, labels);
  const lineColor = steps[0]?.stepStatus === "completed" ? "bg-green-300" : "bg-gray-200";

  return (
    <div className="w-full overflow-hidden">
      <div className="relative py-1">
        {steps.length > 1 && (
          <div
            aria-hidden
            className={`absolute left-1/2 -translate-x-1/2 w-0.5 z-0 ${lineColor}`}
            style={{ top: 14, bottom: 14 }}
          />
        )}
        {steps.map((step, index) => {
          const isLeft = index % 2 === 0;

          return (
            <motion.div
              key={step.role}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.3 }}
              className="relative flex items-start"
              style={{ minHeight: 88 }}
            >
              <div className="w-[calc(50%-18px)] flex-shrink-0">
                {isLeft && (
                  <div className="pr-3 text-right">
                    <StepCard step={step} />
                  </div>
                )}
              </div>

              <StepDot stepStatus={step.stepStatus} />

              <div className="w-[calc(50%-18px)] flex-shrink-0">
                {!isLeft && (
                  <div className="pl-3 text-left">
                    <StepCard step={step} />
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
