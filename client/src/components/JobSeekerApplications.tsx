import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock,
  FileText,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['/api/jobseeker/applications'],
    enabled: !!user && user.role === 'jobseeker',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'interviewing': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadResume = (applicationId: number, firstName: string, lastName: string) => {
    const link = document.createElement('a');
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
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600">Start applying for jobs to see your applications here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{application.job.title}</CardTitle>
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
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="inline mr-1 h-3 w-3" />
                      Applied: {new Date(application.appliedAt).toLocaleDateString()}
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
                        onClick={() => downloadResume(application.id, application.firstName, application.lastName)}
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
                            window.open(`/api/download/cover-letter/${application.id}`, "_blank");
                          } else {
                            // It's text - show in alert (or you could create a modal)
                            alert(application.coverLetter);
                          }
                        }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {application.coverLetter?.startsWith("data:") ? "Download" : "View"} Cover Letter
                      </Button>
                    )}
                  </div>
                </div>
                {application.coverLetter && !application.coverLetter.startsWith("data:") && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter:</p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {application.coverLetter}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}