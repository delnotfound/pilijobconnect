import React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface ApplicationProgressTrackerProps {
  status: string;
}

export function ApplicationProgressTracker({
  status,
}: ApplicationProgressTrackerProps) {
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

  if (isRejected) {
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center gap-3 py-6">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="font-semibold text-red-700">Not Proceeding</p>
            <p className="text-sm text-red-600">
              {status === "not_proceeding"
                ? "The employer is not proceeding with your application"
                : "Your application was rejected"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-4">Application Progress</p>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isCompleted
                      ? "bg-blue-500 text-white"
                      : isCurrent
                        ? "bg-amber-400 text-white"
                        : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>
                <p
                  className={`text-xs font-medium text-center max-w-16 transition-colors ${
                    isCompleted || isCurrent
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    index < currentStepIndex ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Status Label */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">Current Status: </span>
          {status === "additional_docs_required"
            ? "Additional documents required - please upload to proceed"
            : status === "interview_scheduled"
              ? "Interview scheduled"
              : status === "interview_completed"
                ? "Interview completed"
                : status === "reviewed"
                  ? "Your application has been reviewed"
                  : status === "hired"
                    ? "Congratulations! You've been hired"
                    : "Your application has been submitted"}
        </p>
      </div>
    </div>
  );
}
