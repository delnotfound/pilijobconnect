import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase,
  Users,
  Eye,
  Plus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  Upload,
  Shield,
  AlertTriangle,
  FileText,
  Download,
  Edit,
  Trash2,
  Search,
  Clock,
  Video,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PILI_BARANGAYS } from "@shared/barangays";
import EmployerScouting from "@/components/EmployerScouting";

export function EmployerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showJobModal, setShowJobModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  const [verificationData, setVerificationData] = useState({
    barangayPermit: null as File | null,
    businessPermit: null as File | null,
  });
  
  // Interview scheduling modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewData, setInterviewData] = useState({
    date: "",
    time: "",
    venue: "",
    type: "" as "phone" | "video" | "in-person" | "",
    notes: "",
  });
  
  // Not proceeding modal state
  const [showNotProceedingModal, setShowNotProceedingModal] = useState(false);
  const [notProceedingReason, setNotProceedingReason] = useState("");
  
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    category: "",
    salary: "",
    description: "",
    requirements: "",
    requiredSkills: "",
    benefits: "",
  });

  // Fetch employer's jobs
  const { data: employerJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/employer/jobs"],
  });

  // Fetch applications for employer's jobs
  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/employer/applications"],
  });

  // Fetch categories for job posting
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const postJobMutation = useMutation({
    mutationFn: (jobData: any) => apiRequest("/api/jobs", "POST", jobData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      setShowJobModal(false);
      setNewJob({
        title: "",
        company: "",
        location: "",
        type: "",
        category: "",
        salary: "",
        description: "",
        requirements: "",
        requiredSkills: "",
        benefits: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post job",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, jobData }: { id: number; jobData: any }) =>
      apiRequest(`/api/jobs/${id}`, "PATCH", jobData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      setShowJobModal(false);
      setEditingJob(null);
      setNewJob({
        title: "",
        company: "",
        location: "",
        type: "",
        category: "",
        salary: "",
        description: "",
        requirements: "",
        requiredSkills: "",
        benefits: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/jobs/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      setJobToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ 
      id, 
      status, 
      interviewDate,
      interviewTime,
      interviewVenue,
      interviewType,
      interviewNotes,
      notProceedingReason 
    }: { 
      id: number; 
      status: string;
      interviewDate?: string;
      interviewTime?: string;
      interviewVenue?: string;
      interviewType?: string;
      interviewNotes?: string;
      notProceedingReason?: string;
    }) =>
      apiRequest(`/api/applications/${id}`, "PATCH", { 
        status,
        interviewDate,
        interviewTime,
        interviewVenue,
        interviewType,
        interviewNotes,
        notProceedingReason
      }),
    onSuccess: (_, variables) => {
      let message = "Application status updated!";
      if (variables.status === "interview_scheduled") {
        message = "Interview scheduled! SMS notification sent to applicant.";
      } else if (variables.status === "interview_completed") {
        message = "Interview marked as completed! Applicant notified.";
      } else if (variables.status === "not_proceeding") {
        message = "Application marked as not proceeding. Applicant notified with reason.";
      } else if (variables.status === "hired") {
        message = "Congratulations! Applicant has been hired and notified.";
      }
      toast({
        title: "Success",
        description: message,
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/employer/applications"],
      });
      // Reset modal states
      setShowInterviewModal(false);
      setShowNotProceedingModal(false);
      setSelectedApplication(null);
      setInterviewData({ date: "", time: "", venue: "", type: "", notes: "" });
      setNotProceedingReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: {
      barangayPermit: string;
      businessPermit: string;
    }) => apiRequest("/api/employer/verification", "POST", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description:
          "Verification documents submitted! Please wait for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification",
        variant: "destructive",
      });
    },
  });

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is verified
    if (user?.verificationStatus !== "approved") {
      setShowVerificationModal(true);
      return;
    }

    if (editingJob) {
      updateJobMutation.mutate({
        id: editingJob.id,
        jobData: newJob,
      });
    } else {
      postJobMutation.mutate({
        ...newJob,
        employerId: user?.id,
        email: user?.email,
      });
    }
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setNewJob({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      category: job.category,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements || "",
      requiredSkills: job.requiredSkills || "",
      benefits: job.benefits || "",
    });
    setShowJobModal(true);
  };

  const handleDeleteJob = (jobId: number) => {
    setJobToDelete(jobId);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteJobMutation.mutate(jobToDelete);
    }
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setNewJob({
      title: "",
      company: "",
      location: "",
      type: "",
      category: "",
      salary: "",
      description: "",
      requirements: "",
      requiredSkills: "",
      benefits: "",
    });
  };

  const handleFileUpload = async (
    file: File,
    type: "barangayPermit" | "businessPermit"
  ) => {
    try {
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

      // Check file type
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

      setVerificationData((prev) => ({
        ...prev,
        [type]: file,
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationData.barangayPermit || !verificationData.businessPermit) {
      toast({
        title: "Error",
        description: "Please upload both required documents",
        variant: "destructive",
      });
      return;
    }

    try {
      const barangayBase64 = await fileToBase64(
        verificationData.barangayPermit
      );
      const businessBase64 = await fileToBase64(
        verificationData.businessPermit
      );

      submitVerificationMutation.mutate({
        barangayPermit: barangayBase64,
        businessPermit: businessBase64,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process documents",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "applied":
        return "secondary";
      case "reviewed":
        return "default";
      case "interview_scheduled":
        return "outline";
      case "interview_completed":
        return "default";
      case "hired":
        return "default";
      case "not_proceeding":
        return "destructive";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
      case "applied":
        return "Applied";
      case "reviewed":
        return "Reviewed";
      case "interview_scheduled":
        return "Interview Scheduled";
      case "interview_completed":
        return "Interview Completed";
      case "hired":
        return "Hired";
      case "not_proceeding":
        return "Not Proceeding";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };
  
  const handleScheduleInterview = (app: any) => {
    setSelectedApplication(app);
    setShowInterviewModal(true);
  };
  
  const handleNotProceeding = (app: any) => {
    setSelectedApplication(app);
    setShowNotProceedingModal(true);
  };
  
  const submitInterviewSchedule = () => {
    if (!selectedApplication) return;
    
    if (!interviewData.date || !interviewData.time || !interviewData.venue || !interviewData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required interview details",
        variant: "destructive",
      });
      return;
    }
    
    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      status: "interview_scheduled",
      interviewDate: interviewData.date,
      interviewTime: interviewData.time,
      interviewVenue: interviewData.venue,
      interviewType: interviewData.type,
      interviewNotes: interviewData.notes,
    });
  };
  
  const submitNotProceeding = () => {
    if (!selectedApplication) return;
    
    if (!notProceedingReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for not proceeding",
        variant: "destructive",
      });
      return;
    }
    
    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      status: "not_proceeding",
      notProceedingReason: notProceedingReason,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {user?.verificationStatus === "pending" && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your verification is pending approval. You'll be able to post jobs
            once verified.
          </AlertDescription>
        </Alert>
      )}

      {user?.verificationStatus === "approved" && (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✓ Your account is verified! You can now post jobs and access all
            features.
          </AlertDescription>
        </Alert>
      )}

      {user?.verificationStatus === "rejected" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your verification was rejected. Please contact support or resubmit
            your documents.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your job postings and applications
          </p>
        </div>
        <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (user?.verificationStatus !== "approved") {
                  setShowVerificationModal(true);
                } else {
                  setShowJobModal(true);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? "Edit Job" : "Post New Job"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) =>
                      setNewJob({ ...newJob, title: e.target.value })
                    }
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newJob.company}
                    onChange={(e) =>
                      setNewJob({ ...newJob, company: e.target.value })
                    }
                    placeholder="Tech Corp"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={newJob.location}
                    onValueChange={(value) =>
                      setNewJob({ ...newJob, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    value={newJob.salary}
                    onChange={(e) =>
                      setNewJob({ ...newJob, salary: e.target.value })
                    }
                    placeholder="₱25,000 - ₱35,000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Job Type</Label>
                  <Select
                    value={newJob.type}
                    onValueChange={(value) =>
                      setNewJob({ ...newJob, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newJob.category}
                    onValueChange={(value) =>
                      setNewJob({ ...newJob, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Food Service">Food Service</SelectItem>
                      <SelectItem value="Transportation">
                        Transportation
                      </SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Manufacturing">
                        Manufacturing
                      </SelectItem>
                      <SelectItem value="Tourism">Tourism</SelectItem>
                      <SelectItem value="Banking & Finance">
                        Banking & Finance
                      </SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Customer Service">
                        Customer Service
                      </SelectItem>
                      <SelectItem value="Sales & Marketing">
                        Sales & Marketing
                      </SelectItem>
                      <SelectItem value="Administrative">
                        Administrative
                      </SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Beauty & Wellness">
                        Beauty & Wellness
                      </SelectItem>
                      <SelectItem value="Entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Media & Communications">
                        Media & Communications
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) =>
                    setNewJob({ ...newJob, description: e.target.value })
                  }
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={newJob.requirements}
                  onChange={(e) =>
                    setNewJob({ ...newJob, requirements: e.target.value })
                  }
                  placeholder="List the required skills, experience, and qualifications..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredSkills">
                  Required Skills (comma-separated)
                </Label>
                <Input
                  id="requiredSkills"
                  value={newJob.requiredSkills}
                  onChange={(e) =>
                    setNewJob({ ...newJob, requiredSkills: e.target.value })
                  }
                  placeholder="e.g., React, PHP, Customer Service, Communication"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits</Label>
                <Textarea
                  id="benefits"
                  value={newJob.benefits}
                  onChange={(e) =>
                    setNewJob({ ...newJob, benefits: e.target.value })
                  }
                  placeholder="Health insurance, vacation days, remote work options..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseJobModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    postJobMutation.isPending || updateJobMutation.isPending
                  }
                >
                  {editingJob
                    ? updateJobMutation.isPending
                      ? "Updating..."
                      : "Update Job"
                    : postJobMutation.isPending
                    ? "Posting..."
                    : "Post Job"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Verification Modal */}
        <Dialog
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Employer Verification Required</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To post jobs, you need to verify your business by uploading the
                required documents.
              </p>

              <div className="space-y-2">
                <Label htmlFor="barangayPermit">Barangay Permit</Label>
                <Input
                  id="barangayPermit"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.docx"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload(e.target.files[0], "barangayPermit")
                  }
                  required
                />
                {verificationData.barangayPermit && (
                  <p className="text-xs text-green-600">
                    ✓ {verificationData.barangayPermit.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPermit">Business Permit</Label>
                <Input
                  id="businessPermit"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.docx"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload(e.target.files[0], "businessPermit")
                  }
                  required
                />
                {verificationData.businessPermit && (
                  <p className="text-xs text-green-600">
                    ✓ {verificationData.businessPermit.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVerificationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitVerificationMutation.isPending}
                >
                  {submitVerificationMutation.isPending
                    ? "Submitting..."
                    : "Submit for Verification"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employerJobs.length}</div>
            <p className="text-xs text-muted-foreground">Currently hiring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employerJobs.reduce(
                (sum: number, job: any) => sum + (job.viewCount || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Job impressions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="scout">
            <Search className="mr-2 h-4 w-4" />
            Scout Candidates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle></CardTitle>
              <CardDescription>
                Manage and view your active job listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employerJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            ₱
                          </span>
                          {job.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {job.viewCount || 0} views
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{job.type}</Badge>
                      <Badge variant="secondary">{job.category}</Badge>
                      <Badge variant={job.isActive ? "default" : "secondary"}>
                        {job.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {employerJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No job postings yet. Click "Post New Job" to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scout">
          <EmployerScouting />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>
                Review and manage applications for your jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {app.firstName} {app.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Applied for: {app.jobTitle}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {app.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Show interview details if scheduled */}
                      {app.status === "interview_scheduled" && app.interviewDate && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Interview Details
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                              <Calendar className="h-3 w-3" />
                              {new Date(app.interviewDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                              <Clock className="h-3 w-3" />
                              {app.interviewTime && app.interviewTime.includes(':') ? (() => {
                                const parts = app.interviewTime.split(':');
                                if (parts.length < 2) return app.interviewTime;
                                const hour = parseInt(parts[0], 10);
                                const minutes = parts[1];
                                if (isNaN(hour)) return app.interviewTime;
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour % 12 || 12;
                                return `${displayHour}:${minutes} ${ampm}`;
                              })() : (app.interviewTime || 'TBD')}
                            </div>
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                              {app.interviewType === "phone" && <Phone className="h-3 w-3" />}
                              {app.interviewType === "video" && <Video className="h-3 w-3" />}
                              {app.interviewType === "in-person" && <Building className="h-3 w-3" />}
                              {app.interviewType}
                            </div>
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                              <MapPin className="h-3 w-3" />
                              {app.interviewVenue}
                            </div>
                          </div>
                          {app.interviewNotes && (
                            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              Notes: {app.interviewNotes}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Show not proceeding reason if applicable */}
                      {app.status === "not_proceeding" && app.notProceedingReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Reason: {app.notProceedingReason}
                          </p>
                        </div>
                      )}
                      
                      {app.coverLetter && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Cover Letter:</p>
                          {app.coverLetter.startsWith("data:") ||
                          app.coverLetter.startsWith("uploads/") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `/api/download/cover-letter/${app.id}`,
                                  "_blank"
                                )
                              }
                              className="mt-1"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download Cover Letter
                            </Button>
                          ) : (
                            <div className="text-sm text-muted-foreground mt-1 max-h-24 overflow-y-auto">
                              {app.coverLetter || "No cover letter provided"}
                            </div>
                          )}
                        </div>
                      )}
                      {app.resume && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Resume:</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                `/api/download/resume/${app.id}`,
                                "_blank"
                              )
                            }
                            className="mt-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download Resume
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons - Following the workflow */}
                    <div className="flex flex-col space-y-2 ml-4 min-w-[140px]">
                      {/* Step 1: Mark as Reviewed (from Applied) */}
                      {(app.status === "pending" || app.status === "applied") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateApplicationMutation.mutate({
                              id: app.id,
                              status: "reviewed",
                            })
                          }
                          disabled={updateApplicationMutation.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Reviewed
                        </Button>
                      )}
                      
                      {/* Step 2: Schedule Interview (from Reviewed) */}
                      {app.status === "reviewed" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleScheduleInterview(app)}
                          disabled={updateApplicationMutation.isPending}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule Interview
                        </Button>
                      )}
                      
                      {/* Step 3: Mark Interview Completed (from Interview Scheduled) */}
                      {app.status === "interview_scheduled" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            updateApplicationMutation.mutate({
                              id: app.id,
                              status: "interview_completed",
                            })
                          }
                          disabled={updateApplicationMutation.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Interview Done
                        </Button>
                      )}
                      
                      {/* Step 4: Final Decision (from Interview Completed) */}
                      {app.status === "interview_completed" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              updateApplicationMutation.mutate({
                                id: app.id,
                                status: "hired",
                              })
                            }
                            disabled={updateApplicationMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Hire
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleNotProceeding(app)}
                            disabled={updateApplicationMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Proceeding
                          </Button>
                        </>
                      )}
                      
                      {/* Not Proceeding option for any non-final status */}
                      {(app.status === "reviewed" || app.status === "interview_scheduled") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNotProceeding(app)}
                          disabled={updateApplicationMutation.isPending}
                          className="text-destructive"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Proceeding
                        </Button>
                      )}
                      
                      {/* Show status for completed applications */}
                      {(app.status === "hired" || app.status === "not_proceeding") && (
                        <div className="text-sm text-muted-foreground text-center">
                          {app.status === "hired" ? "Successfully Hired" : "Application Closed"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications received yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={jobToDelete !== null}
        onOpenChange={() => setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job
              posting and remove all associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Interview Scheduling Modal */}
      <Dialog open={showInterviewModal} onOpenChange={setShowInterviewModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                <p className="text-sm text-muted-foreground">Applying for: {selectedApplication.jobTitle}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interview-date">Interview Date *</Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-interview-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interview-time">Interview Time *</Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, time: e.target.value }))}
                    data-testid="input-interview-time"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interview-type">Interview Type *</Label>
                <Select
                  value={interviewData.type}
                  onValueChange={(value) => setInterviewData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger id="interview-type" data-testid="select-interview-type">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Call
                      </div>
                    </SelectItem>
                    <SelectItem value="in-person">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        In-Person
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interview-venue">Venue / Meeting Link *</Label>
                <Input
                  id="interview-venue"
                  value={interviewData.venue}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder={interviewData.type === "video" ? "Zoom/Meet link" : interviewData.type === "phone" ? "Phone number to call" : "Office address"}
                  data-testid="input-interview-venue"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interview-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="interview-notes"
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions for the candidate..."
                  rows={3}
                  data-testid="input-interview-notes"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInterviewModal(false);
                    setSelectedApplication(null);
                    setInterviewData({ date: "", time: "", venue: "", type: "", notes: "" });
                  }}
                  data-testid="button-cancel-interview"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitInterviewSchedule}
                  disabled={updateApplicationMutation.isPending}
                  data-testid="button-submit-interview"
                >
                  {updateApplicationMutation.isPending ? "Scheduling..." : "Schedule & Notify"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Not Proceeding Modal */}
      <Dialog open={showNotProceedingModal} onOpenChange={setShowNotProceedingModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Not Proceeding with Application</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                <p className="text-sm text-muted-foreground">Applied for: {selectedApplication.jobTitle}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="not-proceeding-reason">Reason for Not Proceeding *</Label>
                <Textarea
                  id="not-proceeding-reason"
                  value={notProceedingReason}
                  onChange={(e) => setNotProceedingReason(e.target.value)}
                  placeholder="Please provide a reason that will be shared with the applicant..."
                  rows={4}
                  data-testid="input-not-proceeding-reason"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be sent to the applicant via SMS to provide feedback.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNotProceedingModal(false);
                    setSelectedApplication(null);
                    setNotProceedingReason("");
                  }}
                  data-testid="button-cancel-not-proceeding"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={submitNotProceeding}
                  disabled={updateApplicationMutation.isPending}
                  data-testid="button-submit-not-proceeding"
                >
                  {updateApplicationMutation.isPending ? "Submitting..." : "Confirm & Notify"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
