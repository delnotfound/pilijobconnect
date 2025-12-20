import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdditionalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  requiredDocuments: string[];
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function AdditionalDocsModal({
  isOpen,
  onClose,
  applicationId,
  requiredDocuments,
}: AdditionalDocsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const submitDocumentsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest(`/api/applications/${applicationId}/documents`, "POST", {
        submittedDocuments: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Documents submitted successfully! The employer has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/applications"] });
      setUploadedFiles({});
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit documents",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (file: File | null, docType: string) => {
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload PNG, JPG, or PDF files only",
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

      setUploadedFiles((prev) => ({
        ...prev,
        [docType]: file,
      }));
    } else {
      setUploadedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[docType];
        return newFiles;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required documents are uploaded
    const missingDocs = requiredDocuments.filter((doc) => !uploadedFiles[doc]);
    if (missingDocs.length > 0) {
      toast({
        title: "Error",
        description: `Please upload the following required documents: ${missingDocs.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert files to base64
      const base64Files: Record<string, string> = {};
      for (const [docType, file] of Object.entries(uploadedFiles)) {
        base64Files[docType] = await fileToBase64(file);
      }

      submitDocumentsMutation.mutate(base64Files);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process documents",
        variant: "destructive",
      });
    }
  };

  const formatDocumentName = (docType: string) => {
    return docType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Submit Required Documents
          </DialogTitle>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            The employer requires additional documents to proceed with your application. Please upload the
            required documents below.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {requiredDocuments.map((docType) => (
            <div key={docType} className="space-y-2">
              <Label htmlFor={docType}>
                {formatDocumentName(docType)} (Scanned Copy) *
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id={docType}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, docType)}
                  className="hidden"
                />
                {uploadedFiles[docType] ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md">
                      <span className="text-sm font-medium">{uploadedFiles[docType].name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileChange(null, docType)}
                        className="ml-1 hover:text-green-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById(docType)?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Change File
                    </button>
                  </div>
                ) : (
                  <label htmlFor={docType} className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                  </label>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitDocumentsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitDocumentsMutation.isPending ? "Submitting..." : "Submit Documents"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
