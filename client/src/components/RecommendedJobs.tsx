
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, ThumbsUp, ThumbsDown, TrendingUp, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import ApplicationModal from "./ApplicationModal";
import type { Job } from "@shared/schema";

interface JobWithMatch extends Job {
  matchScore: number;
  skillMatch: number;
  locationMatch: number;
  roleMatch: number;
}

interface RecommendedJobsProps {
  onOpenProfileModal?: () => void;
}

export default function RecommendedJobs({ onOpenProfileModal }: RecommendedJobsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: recommendations = [], isLoading } = useQuery<JobWithMatch[]>({
    queryKey: ["/api/jobseeker/recommendations"],
    enabled: !!user && user.role === "jobseeker",
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ jobId, feedback }: { jobId: number; feedback: string }) =>
      apiRequest("/api/jobseeker/match-feedback", "POST", { jobId, feedback }),
    onSuccess: () => {
      toast({
        title: "Feedback recorded",
        description: "Thank you for helping us improve recommendations!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/recommendations"] });
    },
  });

  const getMatchColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const isProfileComplete = user?.skills && user?.desiredRoles && user?.experienceLevel && user?.preferredLocation;

  if (isLoading) {
    return <div>Loading recommendations...</div>;
  }

  if (!isProfileComplete) {
    return (
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-gray-600 mb-4">
            To get personalized job recommendations, please complete your profile with:
          </p>
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            {!user?.skills && (
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> Your skills
              </li>
            )}
            {!user?.desiredRoles && (
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> Desired job roles
              </li>
            )}
            {!user?.experienceLevel && (
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> Experience level
              </li>
            )}
            {!user?.preferredLocation && (
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> Preferred work location
              </li>
            )}
          </ul>
          <Button 
            onClick={onOpenProfileModal}
          >
            Complete Profile Now
          </Button>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">
            Complete your profile with skills and preferences to get personalized job recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Recommended for You</h2>
        </div>

        {recommendations.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <Badge className={getMatchColor(job.matchScore)}>
                      {job.matchScore}% Match
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center">
                      <Briefcase className="mr-1 h-4 w-4" />
                      {job.type}
                    </span>
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>Skills: {job.skillMatch}%</span>
                    <span>Location: {job.locationMatch}%</span>
                    <span>Role: {job.roleMatch}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => {
                    setSelectedJob(job);
                    setIsApplicationModalOpen(true);
                  }}>
                    Apply Now
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => feedbackMutation.mutate({ jobId: job.id, feedback: "thumbs_up" })}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => feedbackMutation.mutate({ jobId: job.id, feedback: "thumbs_down" })}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ApplicationModal
        job={selectedJob}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          setIsApplicationModalOpen(false);
          setSelectedJob(null);
        }}
      />
    </>
  );
}
