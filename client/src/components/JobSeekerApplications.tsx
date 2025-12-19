import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApplicationProgressStepper } from "@/components/ApplicationProgressStepper";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Application {
  id: number;
  jobId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  coverLetter?: string;
  resume?: string;
  status: string;
  appliedAt: string;
  additionalRequirementsRequested?: boolean;
  validIdDocument?: string;
  nbiclearanceDocument?: string;
  personalDataSheetDocument?: string;
  job: {
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
  };
}

export function JobSeekerApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedApplicationForDocs, setSelectedApplicationForDocs] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/jobseeker/applications"],
    enabled: !!user && user.role === "jobseeker",
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (data: {
      applicationId: number;
      validId: File;
      nbiClearance: File;
      personalDataSheet: File | null;
    }) => {
      const formData = new FormData();
      formData.append("validId", data.validId);
      formData.append("nbiClearance", data.nbiClearance);
      if (data.personalDataSheet) {
        formData.append("personalDataSheet", data.personalDataSheet);
      }

      const response = await fetch(`/api/applications/${data.applicationId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload documents");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Documents uploaded successfully! The employer has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/applications"] });
      setShowDocumentModal(false);
      setSelectedApplicationForDocs(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "applied":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "additional_requirements":
        return "bg-orange-100 text-orange-800";
      case "interviewing":
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "not_proceeding":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const downloadResume = (
    applicationId: number,
    firstName: string,
    lastName: string
  ) => {
    const link = document.createElement("a");
    link.href = `/api/download/resume/${applicationId}`;
    link.download = `${firstName}_${lastName}_resume`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <div className="text-sm text-gray-600">
          {applications.length} application
          {applications.length !== 1 ? "s" : ""}
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600">
              Start applying for jobs to see your applications here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card
              key={application.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardTitle className="text-lg">
                      {application.job.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center">
                        <Briefcase className="mr-1 h-4 w-4" />
                        {application.job.company}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {application.job.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {application.job.type}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <ApplicationProgressStepper status={application.status} />
              </CardHeader>
              <CardContent>
                {application.status === "additional_requirements" && application.additionalRequirementsRequested && (
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Documents Required
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                          The employer is requesting your Valid ID and NBI Clearance. Personal Data Sheet is optional.
                        </p>
                        <Button
                          size="sm"
                          className="mt-2 bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            setSelectedApplicationForDocs(application);
                            setShowDocumentModal(true);
                          }}
                          data-testid="button-upload-documents"
                        >
                          Upload Documents
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="inline mr-1 h-3 w-3" />
                      Applied:{" "}
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Salary: {application.job.salary}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {application.resume && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadResume(
                            application.id,
                            application.firstName,
                            application.lastName
                          )
                        }
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Resume
                      </Button>
                    )}
                    {application.coverLetter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (application.coverLetter?.startsWith("data:")) {
                            // It's a file - download it
                            window.open(
                              `/api/download/cover-letter/${application.id}`,
                              "_blank"
                            );
                          } else {
                            // It's text - show in alert (or you could create a modal)
                            alert(application.coverLetter);
                          }
                        }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {application.coverLetter?.startsWith("data:")
                          ? "Download"
                          : "View"}{" "}
                        Cover Letter
                      </Button>
                    )}
                  </div>
                </div>
                {application.coverLetter &&
                  !application.coverLetter.startsWith("data:") && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Cover Letter:</p>
                      <div className="text-sm text-muted-foreground mt-1 max-h-24 overflow-y-auto">
                        {application.coverLetter || "No cover letter provided"}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedApplicationForDocs(null);
        }}
        onUpload={async (documents) => {
          if (!selectedApplicationForDocs) return;
          await uploadDocumentsMutation.mutateAsync({
            applicationId: selectedApplicationForDocs.id,
            validId: documents.validId!,
            nbiClearance: documents.nbiClearance!,
            personalDataSheet: documents.personalDataSheet,
          });
        }}
        isLoading={uploadDocumentsMutation.isPending}
        uploadedDocuments={{
          validId: !!selectedApplicationForDocs?.validIdDocument,
          nbiClearance: !!selectedApplicationForDocs?.nbiclearanceDocument,
          personalDataSheet: !!selectedApplicationForDocs?.personalDataSheetDocument,
        }}
      />
    </div>
  );
}
