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
    nbiClearance: File | null;
    personalDataSheet: File | null;
    curriculumVitae: File | null;
  }) => Promise<void>;
  isLoading: boolean;
  uploadedDocuments?: {
    validId?: boolean;
    nbiClearance?: boolean;
    personalDataSheet?: boolean;
    curriculumVitae?: boolean;
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
  const [nbiClearance, setNbiClearance] = useState<File | null>(null);
  const [personalDataSheet, setPersonalDataSheet] = useState<File | null>(null);
  const [curriculumVitae, setCurriculumVitae] = useState<File | null>(null);
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
    if (!validId || !nbiClearance) {
      setError("Valid ID and NBI Clearance are required");
      return;
    }

    await onUpload({
      validId,
      nbiClearance,
      personalDataSheet,
      curriculumVitae,
    });

    setValidId(null);
    setNbiClearance(null);
    setPersonalDataSheet(null);
    setCurriculumVitae(null);
    onClose();
  };

  const isAllUploaded =
    uploadedDocuments?.validId && uploadedDocuments?.nbiClearance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Required Documents</DialogTitle>
          <DialogDescription>
            The employer requires Valid ID and NBI Clearance. Personal Data Sheet is optional.
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
              <Label htmlFor="nbi-clearance" className="text-sm font-medium">
                NBI Clearance (Scanned Copy) *
              </Label>
              {uploadedDocuments?.nbiClearance && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="nbi-clearance"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setNbiClearance(file);
              }}
              disabled={isLoading || uploadedDocuments?.nbiClearance}
              data-testid="input-nbi-clearance"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="personal-data-sheet" className="text-sm font-medium">
                Personal Data Sheet (Optional)
              </Label>
              {uploadedDocuments?.personalDataSheet && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="personal-data-sheet"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setPersonalDataSheet(file);
              }}
              disabled={isLoading || uploadedDocuments?.personalDataSheet}
              data-testid="input-personal-data-sheet"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="curriculum-vitae" className="text-sm font-medium">
                Curriculum Vitae (Optional)
              </Label>
              {uploadedDocuments?.curriculumVitae && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Input
              id="curriculum-vitae"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = handleFileChange(e.target.files?.[0] || null);
                if (file) setCurriculumVitae(file);
              }}
              disabled={isLoading || uploadedDocuments?.curriculumVitae}
              data-testid="input-curriculum-vitae"
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
              disabled={!validId || !nbiClearance || isLoading}
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
