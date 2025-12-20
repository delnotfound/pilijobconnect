import React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface EmployerApplicationProgressTrackerProps {
  status: string;
  size?: "sm" | "md";
}

export function EmployerApplicationProgressTracker({
  status,
  size = "md",
}: EmployerApplicationProgressTrackerProps) {
  const steps = [
    { id: "applied", label: "Applied" },
    { id: "reviewed", label: "Reviewed" },
    { id: "additional_docs_required", label: "Docs Required" },
    { id: "interview_scheduled", label: "Interview" },
    { id: "hired", label: "Hired" },
  ];

  // Map application statuses to step indices
  const statusToStepIndex: Record<string, number> = {
    pending: 0,
    applied: 0,
    reviewed: 1,
    additional_docs_required: 2,
    interview_scheduled: 3,
    interview_completed: 3,
    hired: 4,
    not_proceeding: -1,
    rejected: -1,
  };

  const currentStepIndex = statusToStepIndex[status] ?? -1;
  const isRejected = status === "not_proceeding" || status === "rejected";

  if (size === "sm") {
    // Compact version for employer dashboard
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-blue-500 text-white"
                    : isCurrent
                      ? "bg-amber-400 text-white"
                      : "bg-gray-300 text-gray-500"
                }`}
                title={step.label}
              >
                {isCompleted ? "✓" : isCurrent ? "•" : ""}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full version
  if (isRejected) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-medium text-red-700">Not Selected</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isCompleted
                      ? "bg-blue-500 text-white"
                      : isCurrent
                        ? "bg-amber-400 text-white"
                        : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {isCompleted ? "✓" : isCurrent ? "•" : ""}
                </div>
                <p className="text-xs font-medium mt-1 text-center">
                  {step.label}
                </p>
              </div>

              {/* Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    index < currentStepIndex ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
