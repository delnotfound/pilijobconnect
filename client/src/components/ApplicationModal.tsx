import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Upload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Job, InsertApplication } from "@shared/schema";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^(\+63|63)?9\d{9}$/, "Invalid Philippine mobile number format"),
  address: z.string().optional(),
  coverLetter: z.string().optional(),
  resume: z.string().min(1, "Resume is required"), // This will be the file path after upload
});

export default function ApplicationModal({ job, isOpen, onClose }: ApplicationModalProps) {
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
      console.log("ApplicationModal - Job keys:", job ? Object.keys(job) : "No job");
    }
  }, [isOpen, job]);

  const [applicationForm, setApplicationForm] = useState<Omit<InsertApplication, "applicantId" | "status" | "notes" | "smsNotificationSent" | "appliedAt" | "updatedAt">>({
    jobId: 0, // Will be set when job is available
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    coverLetter: "",
    resume: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [errors, setErrors] = useState({}); // State to hold validation errors

  // Auto-populate form when user data is available
  useEffect(() => {
    if (user && isOpen && job?.id) {
      // Remove +63 prefix and any spaces/formatting from phone number
      const cleanPhone = user.phone ? 
        user.phone.replace(/^\+?63/, '').replace(/[\s\-\(\)]/g, '').replace(/\D/g, '') : '';

      setApplicationForm(prev => ({
        ...prev,
        jobId: job.id,
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: cleanPhone,
      }));
    }
  }, [user, isOpen, job?.id]);

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: InsertApplication) => {
      console.log("Mutation called with applicationData:", applicationData);
      console.log("Mutation - jobId:", applicationData.jobId);
      console.log("Mutation - API URL:", `/api/jobs/${applicationData.jobId}/apply`);
      return await apiRequest(`/api/jobs/${applicationData.jobId}/apply`, "POST", applicationData);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the employer successfully.",
      });
      resetForm();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/applications"] });
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
    // Remove +63 prefix and any spaces/formatting from phone number
    const cleanPhone = user?.phone ? 
      user.phone.replace(/^\+?63/, '').replace(/[\s\-\(\)]/g, '').replace(/\D/g, '') : '';

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
    });
    setResumeFile(null);
    setCoverLetterFile(null);
    setErrors({}); // Clear errors on reset
  };

  // Placeholder for the submitApplication function, which would typically call the mutation
  const submitApplication = async (applicationData: InsertApplication) => {
    submitApplicationMutation.mutate(applicationData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Debug: Check if job and job.id exist
    console.log("=== HANDLE SUBMIT DEBUG ===");
    console.log("Job object:", job);
    console.log("Job ID:", job?.id);
    console.log("Job ID type:", typeof job?.id);
    console.log("Job is null?", job === null);
    console.log("Job is undefined?", job === undefined);
    console.log("Job keys:", job ? Object.keys(job) : "No job");
    console.log("==========================");

    if (!job || !job.id) {
      console.error("Job or job.id is missing in handleSubmit");
      console.error("Job:", job);
      console.error("Job.id:", job?.id);
      toast({
        title: "Error",
        description: "Job information is missing. Please close and try again.",
        variant: "destructive"
      });
      return;
    }

    // Capture job ID early to prevent it from being lost during async operations
    const jobId = job.id;
    console.log("Captured jobId:", jobId);

    // Validate resume is required
    if (!resumeFile) {
      toast({
        title: "Resume Required",
        description: "Please attach a resume before submitting your application",
        variant: "destructive"
      });
      return;
    }

    // Construct the application data object for validation
    const applicationData = {
      ...applicationForm,
      jobId: jobId, // Ensure jobId is set
      resume: resumeFile.name, // Use filename for initial validation, will be replaced by URL
    };

    try {
      const validatedData = applicationSchema.parse(applicationData);
      console.log("Validated data jobId:", validatedData.jobId);

      // Handle resume upload - convert file to base64
      console.log("Starting resume upload...");
      const resumeBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(resumeFile);
      });
      console.log("Resume converted to base64, length:", resumeBase64.length);

      console.log("Uploading resume to server...");
      const uploadResponse = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: resumeBase64,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Resume upload failed:", errorData);
        throw new Error(errorData.message || 'Failed to upload resume');
      }

      const uploadResult = await uploadResponse.json();
      console.log("Resume upload successful:", uploadResult);

      // Handle cover letter file upload if present
      let coverLetterContent = applicationForm.coverLetter || "";
      if (coverLetterFile) {
        const coverLetterBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(coverLetterFile);
        });

        const coverLetterUploadResponse = await fetch('/api/upload/cover-letter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: coverLetterBase64,
          }),
        });

        if (!coverLetterUploadResponse.ok) {
          const errorData = await coverLetterUploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload cover letter');
        }

        const coverLetterUploadResult = await coverLetterUploadResponse.json();
        coverLetterContent = coverLetterUploadResult.filePath;
      }


      // Update application data with resume path and cover letter content
      // Ensure phone number has proper +63 format for SMS
      const formattedPhone = validatedData.phone.startsWith('+63') 
        ? validatedData.phone 
        : `+63${validatedData.phone.replace(/^\+?63/, '')}`;

      const finalApplicationData = {
        ...validatedData,
        phone: formattedPhone,
        resume: uploadResult.filePath,
        coverLetter: coverLetterContent,
        jobId: jobId, // Ensure jobId is preserved
      };

      console.log("Final application data:", finalApplicationData);
      console.log("Final application data jobId:", finalApplicationData.jobId);
      console.log("Final application data jobId type:", typeof finalApplicationData.jobId);
      console.log("Original captured jobId:", jobId);

      // Double-check that jobId is valid before submitting
      if (!finalApplicationData.jobId || finalApplicationData.jobId === undefined) {
        console.error("CRITICAL: jobId is still undefined in finalApplicationData!");
        console.error("finalApplicationData:", finalApplicationData);
        toast({
          title: "Error",
          description: "Job ID is missing. Please try again.",
          variant: "destructive"
        });
        return;
      }

      await submitApplication(finalApplicationData);
    } catch (error) {
      console.error("Application submission error:", error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Check if it's a file upload error
        const errorMessage = error instanceof Error ? error.message : "Failed to submit application";
        const isFileUploadError = errorMessage.includes('upload') || errorMessage.includes('file');
        
        toast({
          title: isFileUploadError ? "File Upload Failed" : "Application Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, or text file",
          variant: "destructive"
        });
        // Clear the input
        if (e.target) {
          e.target.value = '';
        }
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        // Clear the input
        if (e.target) {
          e.target.value = '';
        }
        return;
      }

      setResumeFile(file);
    }
  };

  const handleCoverLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Cover letter file must be smaller than 2MB",
          variant: "destructive"
        });
        // Clear the input if the file is too large
        if (e.target) {
          e.target.value = '';
        }
        return;
      }

      const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a TXT, PDF, DOC, or DOCX file",
          variant: "destructive"
        });
        // Clear the input if the file type is invalid
        if (e.target) {
          e.target.value = '';
        }
        return;
      }

      setCoverLetterFile(file);
      // Clear text area when file is uploaded
      updateForm("coverLetter", "");
    }
  };

  const updateForm = (field: keyof typeof applicationForm, value: string | number) => {
    setApplicationForm(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
              {errors.firstName && <p id="firstNameError" className="text-red-500 text-sm">{errors.firstName}</p>}
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
              {errors.middleName && <p id="middleNameError" className="text-red-500 text-sm">{errors.middleName}</p>}
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
              {errors.lastName && <p id="lastNameError" className="text-red-500 text-sm">{errors.lastName}</p>}
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
            {errors.email && <p id="emailError" className="text-red-500 text-sm">{errors.email}</p>}
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
                  const cleaned = e.target.value.replace(/[\s\-\(\)\+]/g, '').replace(/^63/, '').replace(/\D/g, '');
                  updateForm("phone", cleaned);
                }}
                placeholder="9171234567"
                className="rounded-l-none"
                required
                aria-invalid={!!errors.phone}
                aria-describedby="phoneError"
              />
            </div>
            {errors.phone && <p id="phoneError" className="text-red-500 text-sm">{errors.phone}</p>}
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


          <div>
            <Label htmlFor="coverLetter">Cover Letter / Application Letter</Label>
            {!coverLetterFile ? (
              <div className="space-y-3">
                <Textarea
                  id="coverLetter"
                  rows={4}
                  placeholder="Tell us why you're interested in this position..."
                  value={applicationForm.coverLetter || ""}
                  onChange={(e) => updateForm("coverLetter", e.target.value)}
                />
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Or upload a cover letter file</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FileText className="mx-auto text-gray-400 h-6 w-6 mb-2" />
                    <label htmlFor="coverLetterUpload" className="text-primary cursor-pointer hover:underline">
                      Upload Cover Letter
                    </label>
                    <p className="text-xs text-gray-500 mt-1">TXT, PDF, DOC, DOCX (Max 2MB)</p>
                    <input
                      id="coverLetterUpload"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleCoverLetterFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      Cover letter file: {coverLetterFile.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoverLetterFile(null);
                      const input = document.getElementById("coverLetterUpload") as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  You can still add additional text below if needed:
                </p>
                <Textarea
                  id="coverLetterAdditional"
                  rows={2}
                  placeholder="Additional notes (optional)..."
                  value={applicationForm.coverLetter || ""}
                  onChange={(e) => updateForm("coverLetter", e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="resume">Resume/CV *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 h-8 w-8 mb-2" />
              <p className="text-gray-600">
                Drag and drop your resume, or{" "}
                <label htmlFor="resumeUpload" className="text-primary cursor-pointer hover:underline">
                  browse files
                </label>
              </p>
              <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, TXT (Max 5MB)</p>
              <input
                id="resumeUpload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleResumeFileChange}
                className="hidden"
              />
              {resumeFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {resumeFile.name} selected
                </div>
              )}
            </div>
             {/* Display error if resume is required and not selected */}
            {!resumeFile && (
              <p className="text-red-500 text-sm mt-2">Resume is required to apply.</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitApplicationMutation.isPending || !resumeFile} className="flex-1">
              {submitApplicationMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}