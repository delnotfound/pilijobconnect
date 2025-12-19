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
  currentStatus: string;
  isPending: boolean;
}

export function ApplicationStatusModal({
  isOpen,
  onClose,
  onUpdate,
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
      value: "interviewing",
      label: "Interview Scheduled",
      description: "Applicant is invited for an interview",
    },
    {
      value: "hired",
      label: "Hired",
      description: "Applicant has been accepted",
    },
    {
      value: "rejected",
      label: "Not Selected",
      description: "Application will not proceed",
    },
  ];

  const handleSave = () => {
    if (!selectedStatus) return;

    if (selectedStatus === "rejected" && !notSelectedReason.trim()) {
      alert("Please provide a reason for not selecting this applicant");
      return;
    }

    onUpdate(selectedStatus, selectedStatus === "rejected" ? notSelectedReason : undefined);
    onClose();
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

          {selectedStatus === "rejected" && (
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
