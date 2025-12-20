import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X } from "lucide-react";

interface EmployerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function EmployerVerificationModal({
  isOpen,
  onClose,
}: EmployerVerificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    contactPerson: "",
    businessDescription: "",
  });
  const [barangayPermit, setBarangayPermit] = useState<File | null>(null);
  const [businessPermit, setBusinessPermit] = useState<File | null>(null);

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert files to base64 and send as JSON
      const barangayBase64 = await fileToBase64(data.barangayPermit);
      const businessBase64 = await fileToBase64(data.businessPermit);

      return apiRequest("/api/employer/verification", "POST", {
        barangayPermit: barangayBase64,
        businessPermit: businessBase64,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description:
          "Verification request submitted successfully! Please wait for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!barangayPermit || !businessPermit) {
      toast({
        title: "Error",
        description: "Please upload both barangay permit and business permit",
        variant: "destructive",
      });
      return;
    }

    submitVerificationMutation.mutate({
      textData: formData,
      barangayPermit,
      businessPermit,
    });
  };

  const handleFileChange = (
    file: File | null,
    type: "barangay" | "business"
  ) => {
    if (file) {
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload PNG, JPG, PDF, or DOCX files only",
          variant: "destructive",
        });
        return;
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
    }

    if (type === "barangay") {
      setBarangayPermit(file);
    } else {
      setBusinessPermit(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employer Verification</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessName: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="businessAddress">Business Address *</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessAddress: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contactPerson: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="businessDescription">Business Description</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessDescription: e.target.value,
                }))
              }
              placeholder="Briefly describe your business..."
            />
          </div>

          <div>
            <Label>Barangay Permit *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.docx"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null, "barangay")
                }
                className="hidden"
                id="barangayPermit"
              />
              <label
                htmlFor="barangayPermit"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {barangayPermit
                    ? barangayPermit.name
                    : "Click to upload barangay permit"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, PDF, DOCX (max 10MB)
                </span>
              </label>
              {barangayPermit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange(null, "barangay")}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label>Business Permit *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.docx"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null, "business")
                }
                className="hidden"
                id="businessPermit"
              />
              <label
                htmlFor="businessPermit"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {businessPermit
                    ? businessPermit.name
                    : "Click to upload business permit"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, PDF, DOCX (max 10MB)
                </span>
              </label>
              {businessPermit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange(null, "business")}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitVerificationMutation.isPending}
            >
              {submitVerificationMutation.isPending
                ? "Submitting..."
                : "Submit Verification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
