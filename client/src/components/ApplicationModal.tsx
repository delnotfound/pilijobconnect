import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Upload, FileText, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Job, InsertApplication } from "@shared/schema";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PILI_BARANGAYS } from "@shared/barangays";

interface ApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

// Define the Zod schema for application data
const applicationSchema = z.object({
  jobId: z.number().min(1, "Job ID is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^(\+63|63)?9\d{9}$/, "Invalid Philippine mobile number format"),
  address: z.string().optional(),
});

export default function ApplicationModal({
  job,
  isOpen,
  onClose,
}: ApplicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Debug: Log job data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("ApplicationModal opened");
      console.log("ApplicationModal - Job data:", job);
      console.log("ApplicationModal - Job ID:", job?.id);
      console.log("ApplicationModal - Job type:", typeof job?.id);
      console.log(
        "ApplicationModal - Job keys:",
        job ? Object.keys(job) : "No job"
      );
    }
  }, [isOpen, job]);

  const [applicationForm, setApplicationForm] = useState<
    Omit<
      InsertApplication,
      | "applicantId"
      | "status"
      | "notes"
      | "smsNotificationSent"
      | "appliedAt"
      | "updatedAt"
    >
  >({
    jobId: 0,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    coverLetter: "",
    resume: "",
    requiredDocuments: "",
    submittedDocuments: "",
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<{
    [key: string]: string;
  }>({});
  const [errors, setErrors] = useState({}); // State to hold validation errors

  // Auto-populate form when user data is available
  useEffect(() => {
    if (user && isOpen && job?.id) {
      console.log("ApplicationModal - Auto-populating with user data:", {
        userResume: user.resume
          ? `${String(user.resume).substring(0, 50)}...`
          : "undefined",
        userCoverLetter: user.coverLetter
          ? `${String(user.coverLetter).substring(0, 50)}...`
          : "undefined",
      });

      // Remove +63 prefix and any spaces/formatting from phone number
      const cleanPhone = user.phone
        ? user.phone
            .replace(/^\+?63/, "")
            .replace(/[\s\-\(\)]/g, "")
            .replace(/\D/g, "")
        : "";

      setApplicationForm((prev) => ({
        ...prev,
        jobId: job.id,
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: cleanPhone,
      }));

      // Auto-populate documents from user profile if available
      const docsFromProfile: { [key: string]: string } = {};
      if (user.resume) {
        docsFromProfile["Resume"] = user.resume;
      }
      if (user.coverLetter) {
        docsFromProfile["Cover_Letter"] = user.coverLetter;
      }

      // Set all documents at once
      if (Object.keys(docsFromProfile).length > 0) {
        console.log(
          "ApplicationModal - Setting uploaded documents from profile:",
          Object.keys(docsFromProfile)
        );
        setUploadedDocuments((prev) => ({
          ...prev,
          ...docsFromProfile,
        }));
      }
    }
  }, [user, isOpen, job?.id]);

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: InsertApplication) => {
      console.log("Mutation called with applicationData:", applicationData);
      console.log("Mutation - jobId:", applicationData.jobId);
      console.log(
        "Mutation - API URL:",
        `/api/jobs/${applicationData.jobId}/apply`
      );
      return await apiRequest(
        `/api/jobs/${applicationData.jobId}/apply`,
        "POST",
        applicationData
      );
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description:
          "Your application has been sent to the employer successfully.",
      });
      resetForm();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/jobseeker/applications"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    const cleanPhone = user?.phone
      ? user.phone
          .replace(/^\+?63/, "")
          .replace(/[\s\-\(\)]/g, "")
          .replace(/\D/g, "")
      : "";

    setApplicationForm({
      jobId: job?.id || 0,
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: cleanPhone,
      address: "",
      coverLetter: "",
      resume: "",
      requiredDocuments: "",
      submittedDocuments: "",
    });
    setUploadedDocuments({});
    setErrors({});
  };

  // Placeholder for the submitApplication function, which would typically call the mutation
  const submitApplication = async (applicationData: InsertApplication) => {
    submitApplicationMutation.mutate(applicationData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!job || !job.id) {
      toast({
        title: "Error",
        description: "Job information is missing. Please close and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate required documents
    if (!uploadedDocuments["Valid_ID"]) {
      toast({
        title: "Missing Required Document",
        description: "Valid ID is required to apply for this position",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedDocuments["NBI_Clearance"]) {
      toast({
        title: "Missing Required Document",
        description: "NBI Clearance is required to apply for this position",
        variant: "destructive",
      });
      return;
    }

    const jobId = job.id;

    const applicationData = {
      jobId: jobId,
      firstName: applicationForm.firstName,
      middleName: applicationForm.middleName || undefined,
      lastName: applicationForm.lastName,
      email: applicationForm.email,
      phone: applicationForm.phone,
      address: applicationForm.address || undefined,
    };

    try {
      const result = applicationSchema.safeParse(applicationData);
      if (!result.success) {
        const fieldErrors: any = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      const formattedPhone = applicationData.phone.startsWith("+63")
        ? applicationData.phone
        : `+63${applicationData.phone.replace(/^\+?63/, "")}`;

      const finalApplicationData = {
        ...applicationData,
        phone: formattedPhone,
        coverLetter: "",
        resume: "application-submitted",
        requiredDocuments:
          Object.keys(uploadedDocuments).length > 0
            ? JSON.stringify(Object.keys(uploadedDocuments))
            : "",
        submittedDocuments:
          Object.keys(uploadedDocuments).length > 0
            ? JSON.stringify(uploadedDocuments)
            : "",
        jobId: jobId,
      };

      if (!finalApplicationData.jobId) {
        toast({
          title: "Error",
          description: "Job ID is missing. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await submitApplication(finalApplicationData as InsertApplication);
    } catch (error) {
      console.error("Application submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit application";
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = (
    documentType: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG)",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      // Convert to base64 and store
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedDocuments((prev) => ({
          ...prev,
          [documentType]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (documentType: string) => {
    setUploadedDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
    });
  };

  const updateForm = (
    field: keyof typeof applicationForm,
    value: string | number
  ) => {
    setApplicationForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!job || !job.id) {
    console.error("ApplicationModal: No job or job.id provided");
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Position</DialogTitle>
        </DialogHeader>

        {/* Job Details Summary */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-900">{job.title}</h4>
            <p className="text-gray-600">{job.company}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" />
                {job.location}
              </span>
              <span className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {job.type}
              </span>
              <span className="flex items-center">
                <span className="mr-1 text-xs">₱</span>
                {job.salary}
              </span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={applicationForm.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                required
                aria-invalid={!!errors.firstName}
                aria-describedby="firstNameError"
              />
              {errors.firstName && (
                <p id="firstNameError" className="text-red-500 text-sm">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                type="text"
                value={applicationForm.middleName}
                onChange={(e) => updateForm("middleName", e.target.value)}
                aria-invalid={!!errors.middleName}
                aria-describedby="middleNameError"
              />
              {errors.middleName && (
                <p id="middleNameError" className="text-red-500 text-sm">
                  {errors.middleName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={applicationForm.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                required
                aria-invalid={!!errors.lastName}
                aria-describedby="lastNameError"
              />
              {errors.lastName && (
                <p id="lastNameError" className="text-red-500 text-sm">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={applicationForm.email}
              onChange={(e) => updateForm("email", e.target.value)}
              required
              aria-invalid={!!errors.email}
              aria-describedby="emailError"
            />
            {errors.email && (
              <p id="emailError" className="text-red-500 text-sm">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                +63
              </span>
              <Input
                id="phone"
                type="tel"
                value={applicationForm.phone}
                onChange={(e) => {
                  // Remove all non-digits and any +63 prefix, then clean spaces
                  const cleaned = e.target.value
                    .replace(/[\s\-\(\)\+]/g, "")
                    .replace(/^63/, "")
                    .replace(/\D/g, "");
                  updateForm("phone", cleaned);
                }}
                placeholder="9171234567"
                className="rounded-l-none"
                required
                aria-invalid={!!errors.phone}
                aria-describedby="phoneError"
              />
            </div>
            {errors.phone && (
              <p id="phoneError" className="text-red-500 text-sm">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Select
              onValueChange={(value) => updateForm("address", value)}
              value={applicationForm.address || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your barangay" />
              </SelectTrigger>
              <SelectContent>
                {PILI_BARANGAYS.map((barangay) => (
                  <SelectItem key={barangay} value={barangay}>
                    {barangay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Requirements Section */}
          {job?.requirements && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Position Requirements
                    </h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Documents Upload */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Application Documents
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                {uploadedDocuments["Resume"] ||
                uploadedDocuments["Cover_Letter"]
                  ? "Your resume and cover letter from your profile have been auto-attached. You can add more documents below."
                  : "Upload your resume, cover letter, and any additional documents required for this position"}
              </p>

              <div className="space-y-3">
                {[
                  "Resume",
                  "Cover_Letter",
                  "Valid_ID",
                  "NBI_Clearance",
                  "Medical_Certificate",
                  "Police_Clearance",
                ].map((docType) => (
                  <div key={docType}>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor={`${docType}-upload`} className="text-sm">
                        {docType === "Cover_Letter"
                          ? "Cover Letter"
                          : docType.replace(/_/g, " ")}
                        {(docType === "Valid_ID" ||
                          docType === "NBI_Clearance") && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        {(docType === "Resume" || docType === "Cover_Letter") &&
                        uploadedDocuments[docType] ? (
                          <span className="text-xs text-blue-600 ml-2">
                            (from profile)
                          </span>
                        ) : null}
                      </Label>
                      {uploadedDocuments[docType] && (
                        <span className="text-xs text-green-600">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>

                    {!uploadedDocuments[docType] ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                        <FileText className="mx-auto text-gray-400 h-5 w-5 mb-2" />
                        <label
                          htmlFor={`${docType}-upload`}
                          className="text-sm text-primary cursor-pointer hover:underline"
                        >
                          Upload{" "}
                          {docType === "Cover_Letter"
                            ? "Cover Letter"
                            : docType.replace(/_/g, " ")}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF or Image (Max 5MB)
                        </p>
                        <input
                          id={`${docType}-upload`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(docType, e)}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Document uploaded
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(docType)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitApplicationMutation.isPending}
              className="flex-1"
            >
              {submitApplicationMutation.isPending
                ? "Submitting..."
                : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
