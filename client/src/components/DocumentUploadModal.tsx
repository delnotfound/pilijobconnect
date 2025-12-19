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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, CheckCircle } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (documents: {
    validId: File | null;
    policeClearance: File | null;
    sssProof: File | null;
  }) => Promise<void>;
  isLoading: boolean;
  uploadedDocuments?: {
    validId?: boolean;
    policeClearance?: boolean;
    sssProof?: boolean;
  };
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  isLoading,
  uploadedDocuments = {},
}: DocumentUploadModalProps) {
  const [validId, setValidId] = useState<File | null>(null);
  const [policeClearance, setPoliceClearance] = useState<File | null>(null);
  const [sssProof, setSssProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    file: File | null,
    maxSize: number = 5 * 1024 * 1024
  ) => {
    if (file && file.size > maxSize) {
      setError("File size must not exceed 5MB");
      return null;
    }
    setError(null);
    return file;
  };

  const handleSubmit = async () => {
    if (!validId || !policeClearance || !sssProof) {
      setError("All three documents are required");
      return;
    }

    await onUpload({
      validId,
      policeClearance,
      sssProof,
    });

    setValidId(null);
    setPoliceClearance(null);
    setSssProof(null);
    onClose();
  };

  const isAllUploaded =
    uploadedDocuments?.validId &&
    uploadedDocuments?.policeClearance &&
    uploadedDocuments?.sssProof;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Required Documents</DialogTitle>
          <DialogDescription>
            The employer is requesting the following documents to proceed with
            your application
          </DialogDescription>
        </DialogHeader>

        {isAllUploaded && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              All documents have been successfully submitted!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valid-id" className="text-sm font-medium">
                Valid ID (Scanned Copy) *
              </Label>
              {uploadedDocuments?.validId && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="valid-id"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setValidId(file);
              }}
              disabled={isLoading || uploadedDocuments?.validId}
              data-testid="input-valid-id"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="police-clearance" className="text-sm font-medium">
                Police Clearance (Scanned Copy) *
              </Label>
              {uploadedDocuments?.policeClearance && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="police-clearance"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setPoliceClearance(file);
              }}
              disabled={isLoading || uploadedDocuments?.policeClearance}
              data-testid="input-police-clearance"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sss-proof" className="text-sm font-medium">
                SSS Proof (Scanned Copy) *
              </Label>
              {uploadedDocuments?.sssProof && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="sss-proof"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setSssProof(file);
              }}
              disabled={isLoading || uploadedDocuments?.sssProof}
              data-testid="input-sss-proof"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isAllUploaded}
            data-testid="button-cancel-documents"
          >
            {isAllUploaded ? "Close" : "Cancel"}
          </Button>
          {!isAllUploaded && (
            <Button
              onClick={handleSubmit}
              disabled={!validId || !policeClearance || !sssProof || isLoading}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-submit-documents"
            >
              {isLoading ? "Submitting..." : "Submit Documents"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
