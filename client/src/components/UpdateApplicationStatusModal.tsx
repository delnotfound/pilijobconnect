import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Calendar, XCircle, ThumbsUp, FileText } from "lucide-react";

interface UpdateApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantName: string;
  currentStatus: string;
  applicationId: string;
  onStatusSelect: (status: string) => void;
  onScheduleInterview?: () => void;
  onNotProceeding?: () => void;
}

export function UpdateApplicationStatusModal({
  isOpen,
  onClose,
  applicantName,
  currentStatus,
  applicationId,
  onStatusSelect,
  onScheduleInterview,
  onNotProceeding,
}: UpdateApplicationStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const statusOptions = [
    {
      value: "reviewed",
      label: "Reviewed",
      description: "Application has been checked",
      icon: CheckCircle,
      show: currentStatus === "pending" || currentStatus === "applied",
    },
    {
      value: "additional_docs_required",
      label: "Request Additional Documents",
      description: "Applicant needs to submit more documents",
      icon: FileText,
      show:
        currentStatus === "pending" ||
        currentStatus === "applied" ||
        currentStatus === "reviewed",
    },
    {
      value: "interview_scheduled",
      label: "Interview Scheduled",
      description: "Applicant is invited for an interview",
      icon: Calendar,
      show:
        currentStatus === "pending" ||
        currentStatus === "applied" ||
        currentStatus === "reviewed" ||
        currentStatus === "additional_docs_required",
    },
    {
      value: "interview_done",
      label: "Interview Done",
      description: "Interview has been completed",
      icon: CheckCircle,
      show: currentStatus === "interview_scheduled",
    },
    {
      value: "hired",
      label: "Hired",
      description: "Applicant has been accepted",
      icon: ThumbsUp,
      show: currentStatus === "interview_completed",
    },
    {
      value: "not_proceeding",
      label: "Not Proceeding",
      description: "Application will not proceed",
      icon: XCircle,
      show:
        currentStatus === "pending" ||
        currentStatus === "applied" ||
        currentStatus === "reviewed" ||
        currentStatus === "additional_docs_required" ||
        currentStatus === "interview_scheduled" ||
        currentStatus === "interview_completed",
    },
  ];

  const visibleOptions = statusOptions.filter((opt) => opt.show);

  const handleSave = () => {
    if (!selectedStatus) return;

    if (selectedStatus === "interview_scheduled") {
      onScheduleInterview?.();
    } else if (selectedStatus === "not_proceeding") {
      onNotProceeding?.();
    } else if (selectedStatus === "interview_done") {
      onStatusSelect("interview_completed");
    } else {
      onStatusSelect(selectedStatus);
    }
    
    setSelectedStatus("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Select the current status to notify {applicantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="space-y-3">
              {visibleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                    onClick={() => setSelectedStatus(option.value)}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedStatus}
            className="bg-green-600 hover:bg-green-700"
          >
            Save & Notify Applicant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
