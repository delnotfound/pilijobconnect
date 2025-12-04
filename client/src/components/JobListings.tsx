import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Briefcase,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Eye,
  Users,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Building } from "lucide-react";
import ApplicationModal from "./ApplicationModal";
import JobViewModal from "./JobViewModal";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import type { Job } from "@shared/schema";

interface JobListingsProps {
  searchQuery: string;
  locationFilter: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface JobsResponse {
  jobs: Job[];
  pagination: PaginationInfo;
}

export default function JobListings({ searchQuery, locationFilter }: JobListingsProps) {
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSalary, setSelectedSalary] = useState("Any Salary");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isJobViewModalOpen, setIsJobViewModalOpen] = useState(false);
  const [jobForApplication, setJobForApplication] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<JobsResponse>({
    queryKey: ["/api/jobs", searchQuery, locationFilter, selectedCategory, selectedSalary, selectedJobTypes, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) params.append('q', searchQuery.trim());
      if (locationFilter && locationFilter !== 'Pili (All Areas)') params.append('location', locationFilter);
      if (selectedCategory && selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      if (selectedSalary && selectedSalary !== 'Any Salary') params.append('salary', selectedSalary);
      if (selectedJobTypes.length > 0) params.append('jobTypes', selectedJobTypes.join(','));
      params.append('page', currentPage.toString());
      params.append('limit', '7'); // Show 7 jobs per page

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  // Fetch saved jobs for the current user
  const { data: savedJobsData = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobseeker/saved-jobs'],
    enabled: isAuthenticated && user?.role === 'jobseeker',
  });

  // Create a Set of saved job IDs for quick lookup
  const savedJobIds = new Set(savedJobsData.map(job => job.id));

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

  const jobs = data?.jobs || [];
  const pagination = data?.pagination;

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    let newJobTypes;
    if (checked) {
      newJobTypes = [...selectedJobTypes, jobType];
    } else {
      newJobTypes = selectedJobTypes.filter(type => type !== jobType);
    }
    setSelectedJobTypes(newJobTypes);
    setCurrentPage(1);
  };

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
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

    if (savedJobIds.has(jobId)) {
      removeSavedJobMutation.mutate(jobId);
    } else {
      saveJobMutation.mutate(jobId);
    }
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsJobViewModalOpen(true);
  };

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedJob(job);
    setJobForApplication(job);
    setIsApplicationModalOpen(true);
  };

  const handleApplyFromModal = () => {
    console.log("handleApplyFromModal called");
    console.log("selectedJob:", selectedJob);
    console.log("selectedJob.id:", selectedJob?.id);

    setIsJobViewModalOpen(false);
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    // Ensure selectedJob is set before opening application modal
    if (selectedJob && selectedJob.id) {
      console.log("Opening application modal with job:", selectedJob);
      setJobForApplication(selectedJob);
      setIsApplicationModalOpen(true);
    } else {
      console.error("No selectedJob or job.id found when trying to apply!");
      toast({
        title: "Error",
        description: "Job information is missing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedCategory("All Categories");
    setSelectedSalary("Any Salary");
    setSortOrder("Newest First");
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  const handleFilterChange = (setter: Function, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortOrder) {
      case "Salary: High to Low":
        return b.salary.localeCompare(a.salary);
      case "Salary: Low to High":
        return a.salary.localeCompare(b.salary);
      case "Company A-Z":
        return a.company.localeCompare(b.company);
      default: // Newest First
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    }
  });

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `Posted ${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Posted ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Education": "bg-blue-100 text-blue-800",
      "Healthcare": "bg-green-100 text-green-800",
      "Retail": "bg-purple-100 text-purple-800",
      "Food Service": "bg-orange-100 text-orange-800",
      "Transportation": "bg-orange-100 text-orange-800",
      "Construction": "bg-yellow-100 text-yellow-800",
      "Agriculture": "bg-green-100 text-green-800",
      "Government": "bg-blue-100 text-blue-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Full-time": "bg-green-100 text-green-800",
      "Part-time": "bg-yellow-100 text-yellow-800",
      "Contract": "bg-blue-100 text-blue-800",
      "Freelance": "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <section id="jobs" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading jobs...</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="jobs" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-80">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Filter Jobs</h3>

                  {/* Job Type Filter */}
                  <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-3">Job Type</Label>
                    <div className="space-y-2">
                      {["Full-time", "Part-time", "Contract", "Freelance"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedJobTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              handleJobTypeChange(type, checked as boolean);
                              setCurrentPage(1);
                            }}
                          />
                          <Label htmlFor={type} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-3">Category</Label>
                    <Select value={selectedCategory} onValueChange={(value) => handleFilterChange(setSelectedCategory, value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Categories">All Categories</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Food Service">Food Service</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Range */}
                  <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-3">Salary Range (Monthly)</Label>
                    <Select value={selectedSalary} onValueChange={(value) => handleFilterChange(setSelectedSalary, value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any Salary">Any Salary</SelectItem>
                        <SelectItem value="₱15,000 - ₱20,000">₱15,000 - ₱20,000</SelectItem>
                        <SelectItem value="₱20,000 - ₱30,000">₱20,000 - ₱30,000</SelectItem>
                        <SelectItem value="₱30,000 - ₱50,000">₱30,000 - ₱50,000</SelectItem>
                        <SelectItem value="₱50,000+">₱50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Job Listings */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Available Jobs</h3>
                  <p className="text-gray-600">
                    {pagination ? (
                      <>Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} jobs</>
                    ) : (
                      <>Showing {sortedJobs.length} jobs</>
                    )}
                    {pagination && pagination.totalPages > 1 && (
                      <span> - Page {pagination.currentPage} of {pagination.totalPages}</span>
                    )}
                  </p>
                </div>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Newest First">Newest First</SelectItem>
                    <SelectItem value="Salary: High to Low">Salary: High to Low</SelectItem>
                    <SelectItem value="Salary: Low to High">Salary: Low to High</SelectItem>
                    <SelectItem value="Company A-Z">Company A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {sortedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="text-primary h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="text-lg font-semibold text-gray-900 hover:text-green-600 cursor-pointer"
                                onClick={() => handleViewJob(job)}
                              >
                                {job.title}
                              </h4>
                              <p className="text-gray-600 mb-2">{job.company}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <MapPin className="mr-1 h-4 w-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {job.type}
                                </span>
                                <span className="flex items-center">
                                  {job.salary}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge className={getCategoryColor(job.category)}>
                                  {job.category}
                                </Badge>
                                <Badge className={getTypeColor(job.type)}>
                                  {job.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {isAuthenticated && user?.role === 'jobseeker' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveJob(job.id)}
                              disabled={saveJobMutation.isPending || removeSavedJobMutation.isPending}
                              className={`flex items-center gap-1 ${
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
                              {savedJobIds.has(job.id) ? 'Saved' : 'Save'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleViewJob(job)}
                            className="flex-1 sm:flex-none"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleApplyClick(job)}
                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-gray-600 text-sm">{job.description}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-gray-500">{getRelativeTime(job.postedAt)}</span>
                          <span className="text-xs text-green-600 font-medium flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {sortedJobs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No jobs found matching your criteria.</p>
                </div>
              )}

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => pagination.hasPrevious && setCurrentPage(pagination.currentPage - 1)}
                          className={pagination.hasPrevious ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === pagination.currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => pagination.hasNext && setCurrentPage(pagination.currentPage + 1)}
                          className={pagination.hasNext ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ApplicationModal
        job={jobForApplication}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          console.log("Closing application modal");
          setIsApplicationModalOpen(false);
          setJobForApplication(null);
        }}
      />

      <JobViewModal
        job={selectedJob}
        isOpen={isJobViewModalOpen}
        onClose={() => setIsJobViewModalOpen(false)}
        onApply={handleApplyFromModal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}