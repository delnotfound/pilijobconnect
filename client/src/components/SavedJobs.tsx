import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, DollarSign, Clock, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import ApplicationModal from "@/components/ApplicationModal";
import type { Job } from "@shared/schema";

interface SavedJob {
  id: number;
  userId: number;
  jobId: number;
  savedAt: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    category: string;
    description: string;
    requirements: string;
    benefits: string;
    postedAt: string;
    updatedAt: string;
  };
}

export default function SavedJobs() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: savedJobs = [], isLoading } = useQuery<SavedJob[]>({
    queryKey: ["/api/jobseeker/saved-jobs"],
    enabled: !!user && user.role === "jobseeker",
    onSuccess: (data) => {
      console.log("Saved jobs data:", data);
    },
    onError: (error) => {
      console.error("Error fetching saved jobs:", error);
    }
  });

  const removeSavedJobMutation = useMutation({
    mutationFn: (jobId: number) =>
      apiRequest(`/api/jobseeker/saved-jobs/${jobId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/saved-jobs"] });
      toast({
        title: "Job removed",
        description: "Job has been removed from your saved list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove saved job",
        variant: "destructive",
      });
    },
  });

  const handleRemoveSavedJob = (jobId: number) => {
    removeSavedJobMutation.mutate(jobId);
  };

  const handleApply = (savedJob: SavedJob) => {
    // The savedJob.job already contains the full Job object from the API
    setSelectedJob(savedJob.job as Job);
    setIsApplicationModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading saved jobs...</div>
      </div>
    );
  }

  if (!savedJobs.length) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No saved jobs yet
            </h3>
            <p className="text-gray-500">
              Save jobs you're interested in to apply to them later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
          <p className="text-muted-foreground">
            {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {savedJobs.map((savedJob) => {
          // Safety check to prevent errors if job data is missing
          if (!savedJob || !savedJob.job) {
            return null;
          }
          
          return (
            <Card key={savedJob.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{savedJob.job.title}</CardTitle>
                    <p className="text-lg font-medium text-primary mt-1">
                      {savedJob.job.company}
                    </p>
                  </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSavedJob(savedJob.jobId)}
                    disabled={removeSavedJobMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {savedJob.job.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {savedJob.job.salary}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {savedJob.job.type}
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary">{savedJob.job.category}</Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {savedJob.job.description}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(savedJob.job.postedAt).toLocaleDateString()}
                  {savedJob.savedAt && (
                    <>
                      {" • Saved "}
                      {new Date(savedJob.savedAt).toLocaleDateString()}
                    </>
                  )}
                </p>
                <Button size="sm" onClick={() => handleApply(savedJob)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <ApplicationModal
        job={selectedJob}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          setIsApplicationModalOpen(false);
          setSelectedJob(null);
        }}
      />
    </div>
  );
}