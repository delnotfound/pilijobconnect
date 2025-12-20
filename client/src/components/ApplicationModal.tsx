import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, FileText, Loader2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Job, InsertApplication } from "@shared/schema";
import { z } from "zod";

interface ApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationModal({ job, isOpen, onClose }: ApplicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [applicationForm, setApplicationForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    coverLetter: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-populate form when user data is available
  useEffect(() => {
    if (user && isOpen && job?.id) {
      const cleanPhone = user.phone ? 
        user.phone.replace(/^\+?63/, '').replace(/[\s\-\(\)]/g, '').replace(/\D/g, '') : '';

      setApplicationForm(prev => ({
        ...prev,
        firstName: user.firstName || "",
        middleName: (user as any).middleName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: cleanPhone,
      }));
    }
  }, [user, isOpen, job?.id]);

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: InsertApplication) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    const cleanPhone = user?.phone ? 
      user.phone.replace(/^\+?63/, '').replace(/[\s\-\(\)]/g, '').replace(/\D/g, '') : '';

    setApplicationForm({
      firstName: user?.firstName || "",
      middleName: (user as any)?.middleName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: cleanPhone,
      address: "",
      coverLetter: "",
    });
    setResumeFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!job || !job.id) {
      toast({
        title: "Error",
        description: "Job information is missing. Please close and try again.",
        variant: "destructive"
      });
      return;
    }

    if (!resumeFile) {
      toast({
        title: "Resume Required",
        description: "Please attach a resume before submitting your application",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to apply",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const applicationData: InsertApplication = {
        jobId: job.id,
        firstName: applicationForm.firstName.trim(),
        middleName: applicationForm.middleName?.trim() || "",
        lastName: applicationForm.lastName.trim(),
        email: applicationForm.email.trim(),
        phone: applicationForm.phone.trim(),
        address: applicationForm.address?.trim() || "",
        coverLetter: applicationForm.coverLetter?.trim() || "",
        resume: resumeFile.name,
      } as InsertApplication;

      await submitApplicationMutation.mutateAsync(applicationData);
    } catch (error) {
      console.error("Application submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({
      ...prev,
      [name]: value || "",
    }));
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResumeFile(e.target.files[0]);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Details Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>₱ {job.salary}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={applicationForm.firstName || ""}
                  onChange={handleInputChange}
                  data-testid="input-firstname"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  name="middleName"
                  value={applicationForm.middleName || ""}
                  onChange={handleInputChange}
                  data-testid="input-middlename"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={applicationForm.lastName || ""}
                  onChange={handleInputChange}
                  data-testid="input-lastname"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={applicationForm.email || ""}
                  onChange={handleInputChange}
                  data-testid="input-email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={applicationForm.phone || ""}
                  onChange={handleInputChange}
                  data-testid="input-phone"
                  className={errors.phone ? "border-red-500" : ""}
                  placeholder="9123456789"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={applicationForm.address || ""}
                onChange={handleInputChange}
                data-testid="input-address"
              />
            </div>
          </div>

          {/* Application Documents */}
          <div className="space-y-3">
            <h3 className="font-semibold">Application Documents</h3>
            
            <div>
              <Label htmlFor="resume">Resume (PDF/DOC) *</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  onChange={handleResumeUpload}
                  data-testid="input-resume"
                  accept=".pdf,.doc,.docx"
                />
              </div>
              {resumeFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  {resumeFile.name}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                name="coverLetter"
                value={applicationForm.coverLetter || ""}
                onChange={handleInputChange}
                data-testid="input-coverletter"
                placeholder="Tell the employer why you're a great fit for this role..."
                rows={4}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              data-testid="button-submit-application"
              disabled={submitApplicationMutation.isPending || isLoading}
              className="flex-1"
            >
              {submitApplicationMutation.isPending || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
