import { useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2, 
  Calendar,
  Eye,
  Users,
  Phone,
  Mail,
  Heart,
  Briefcase
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Job } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface JobViewModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function JobViewModal({ job, isOpen, onClose, onApply }: JobViewModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug: Log job data when modal opens
  useEffect(() => {
    if (isOpen && job) {
      console.log("JobViewModal - Job data:", job);
      console.log("JobViewModal - Job ID:", job.id);
    }
  }, [isOpen, job]);

  // Track view when modal opens
  useEffect(() => {
    if (isOpen && job) {
      incrementViewMutation.mutate(job.id);
    }
  }, [isOpen, job?.id]);

  const incrementViewMutation = useMutation({
    mutationFn: (jobId: number) => apiRequest(`/api/jobs/${jobId}/view`, "POST"),
    onSuccess: () => {
      // Invalidate job stats to update view counts
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    }
  });

  // Fetch saved jobs for the current user
  const { data: savedJobsData = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobseeker/saved-jobs'],
    enabled: isAuthenticated && user?.role === 'jobseeker',
  });

  // Create a Set of saved job IDs for quick lookup
  const savedJobIds = new Set(savedJobsData.map(savedJob => savedJob.id));

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: (jobId: number) => apiRequest(`/api/jobseeker/saved-jobs/${jobId}`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobseeker/saved-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive"
      });
    }
  });

  // Remove saved job mutation
  const removeSavedJobMutation = useMutation({
    mutationFn: (jobId: number) => apiRequest(`/api/jobseeker/saved-jobs/${jobId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job removed from saved list!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobseeker/saved-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove saved job",
        variant: "destructive"
      });
    }
  });

  const handleSaveJob = () => {
    if (!job) return;

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save jobs",
        variant: "destructive"
      });
      return;
    }

    if (user?.role !== 'jobseeker') {
      toast({
        title: "Error",
        description: "Only job seekers can save jobs",
        variant: "destructive"
      });
      return;
    }

    if (savedJobIds.has(job.id)) {
      removeSavedJobMutation.mutate(job.id);
    } else {
      saveJobMutation.mutate(job.id);
    }
  };


  if (!job) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company and Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{job.company}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {job.type}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1 text-xs">₱</span>
                        {job.salary}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {job.category}
                  </Badge>
                  {job.isFeatured && (
                    <Badge variant="destructive" className="w-fit">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              {/* Job Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>{job.viewCount} views</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{job.applicantCount} applicants</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {formatDate(job.postedAt)}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Briefcase className="h-4 w-4" />
                    <span className={job.isActive ? "text-green-600" : "text-red-600"}>
                      {job.isActive ? "Active" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-3">Job Description</h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-3">Requirements</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && (
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-3">Benefits</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{job.email}</span>
                </div>
                {job.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{job.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {isAuthenticated && user?.role === 'jobseeker' && (
              <Button
                variant="outline"
                onClick={handleSaveJob}
                disabled={saveJobMutation.isPending || removeSavedJobMutation.isPending}
                className={`flex items-center gap-2 ${
                  savedJobIds.has(job.id) 
                    ? 'text-red-600 border-red-600 hover:bg-red-50' 
                    : 'text-gray-600 hover:text-red-600 hover:border-red-600'
                }`}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    savedJobIds.has(job.id) ? 'fill-current' : ''
                  }`} 
                />
                {savedJobIds.has(job.id) ? 'Saved' : 'Save Job'}
              </Button>
            )}
            <Button onClick={onApply} className="bg-green-600 hover:bg-green-700 flex-1">
              Apply for this Position
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}