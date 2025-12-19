import { CheckCircle2, AlertCircle, XCircle, Calendar } from "lucide-react";

interface ApplicationProgressStepperProps {
  status: string;
}

// Map various status values to standardized stages
const normalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "applied",
    applied: "applied",
    reviewed: "reviewed",
    additional_requirements: "additional_requirements",
    interviewing: "interviewing",
    "interview_scheduled": "interviewing",
    hired: "hired",
    rejected: "rejected",
    "not_proceeding": "rejected",
  };
  return statusMap[status.toLowerCase()] || status;
};

export function ApplicationProgressStepper({
  status,
}: ApplicationProgressStepperProps) {
  const normalizedStatus = normalizeStatus(status);

  // Define the stages in order
  const stages = [
    { key: "applied", label: "Applied", icon: CheckCircle2 },
    { key: "reviewed", label: "Reviewed", icon: CheckCircle2 },
    { key: "additional_requirements", label: "Additional Docs", icon: AlertCircle },
    { key: "interviewing", label: "For Interview", icon: Calendar },
    { key: "hired", label: "Hired", icon: CheckCircle2 },
    { key: "rejected", label: "Not Selected", icon: XCircle },
  ];

  // Determine the current stage index
  const currentIndex = stages.findIndex((s) => s.key === normalizedStatus);
  const isRejected = normalizedStatus === "rejected";

  return (
    <div className="w-full py-6 px-4 bg-white rounded-lg">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          // Determine if this stage is completed, current, or pending
          const isCompleted = !isRejected
            ? index < currentIndex
            : normalizedStatus === stage.key;
          const isCurrent = !isRejected ? index === currentIndex : false;
          const isPending = !isRejected
            ? index > currentIndex
            : index !== currentIndex;

          const IconComponent = stage.icon;

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Line before (except for first stage) */}
              {index > 0 && (
                <div
                  className={`absolute left-0 top-6 h-0.5 -ml-1/2 -mr-1/2`}
                  style={{
                    width: "calc(100% - 40px)",
                    backgroundColor: isCompleted ? "#3B82F6" : "#E5E7EB",
                  }}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isCompleted
                    ? "bg-blue-500 text-white"
                    : isCurrent
                      ? "bg-amber-400 text-white"
                      : isPending
                        ? "bg-gray-200 text-gray-400"
                        : ""
                }`}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Label */}
              <p
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  isCurrent ? "text-gray-900 font-semibold" : "text-gray-600"
                }`}
              >
                {stage.label}
              </p>

              {/* Current Status indicator */}
              {isCurrent && (
                <p className="text-xs text-gray-500 mt-1">Current Status</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
