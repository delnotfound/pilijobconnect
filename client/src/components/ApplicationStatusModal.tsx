import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: string, reason?: string) => void;
  onInterviewScheduleRequested?: () => void;
  currentStatus: string;
  isPending: boolean;
}

export function ApplicationStatusModal({
  isOpen,
  onClose,
  onUpdate,
  onInterviewScheduleRequested,
  currentStatus,
  isPending,
}: ApplicationStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notSelectedReason, setNotSelectedReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus("");
      setNotSelectedReason("");
    }
  }, [isOpen]);

  const statusOptions = [
    {
      value: "reviewed",
      label: "Reviewed",
      description: "Application has been checked",
    },
    {
      value: "additional_requirements",
      label: "Additional Requirements",
      description: "Request applicant to submit required documents",
    },
    {
      value: "interview_scheduled",
      label: "Interview Scheduled",
      description: "Applicant is invited for an interview",
    },
    {
      value: "hired",
      label: "Hired",
      description: "Applicant has been accepted",
    },
    {
      value: "not_proceeding",
      label: "Not Selected",
      description: "Application will not proceed",
    },
  ];

  const handleSave = () => {
    if (!selectedStatus) return;

    if (selectedStatus === "not_proceeding" && !notSelectedReason.trim()) {
      alert("Please provide a reason for not selecting this applicant");
      return;
    }

    // Special handling for interview_scheduled: trigger interview modal instead of direct update
    if (selectedStatus === "interview_scheduled") {
      onClose(); // Close the status modal first
      // Call the interview schedule callback to open the interview modal
      if (onInterviewScheduleRequested) {
        onInterviewScheduleRequested();
      }
      return;
    }

    onUpdate(
      selectedStatus,
      selectedStatus === "not_proceeding" ? notSelectedReason : undefined
    );
    onClose();
  };

  const getStatusDescription = () => {
    if (selectedStatus === "additional_requirements") {
      return "The applicant will be notified to submit: Valid ID, Police Clearance, and SSS Proof.";
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the current status to notify the applicant
          </p>

          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedStatus === "not_proceeding" && (
            <div className="space-y-2 mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-md">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for not selecting *
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why this applicant was not selected..."
                value={notSelectedReason}
                onChange={(e) => setNotSelectedReason(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>
          )}

          {getStatusDescription() && (
            <div className="space-y-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {getStatusDescription()}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-testid="button-cancel-status"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedStatus || isPending}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-save-status"
          >
            Save & Notify Applicant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
