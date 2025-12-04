import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Eye, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PILI_BARANGAYS } from "@shared/barangays";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  salary: string;
  description: string;
  requirements?: string;
  benefits?: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  applicantCount: number;
  postedAt: string;
}

interface JobManagementProps {
  jobs: Job[];
}

export function JobManagement({ jobs }: JobManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    category: "",
    salary: "",
    description: "",
    requirements: "",
    benefits: "",
    isActive: true,
    isFeatured: false
  });

  const updateJobMutation = useMutation({
    mutationFn: (data: { id: number; jobData: any }) =>
      apiRequest(`/api/admin/jobs/${data.id}`, "PUT", data.jobData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      setEditingJob(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive"
      });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/jobs/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive"
      });
    }
  });

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      category: job.category,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      isActive: job.isActive,
      isFeatured: job.isFeatured
    });
  };

  const handleUpdateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJob) {
      updateJobMutation.mutate({
        id: editingJob.id,
        jobData: editFormData
      });
    }
  };

  const handleDeleteJob = (job: Job) => {
    if (confirm(`Are you sure you want to delete the job "${job.title}" at ${job.company}?`)) {
      deleteJobMutation.mutate(job.id);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location & Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="text-xs">₱</span>
                    {job.salary}
                  </div>
                </div>
              </TableCell>
              <TableCell>{job.company}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {job.type}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{job.category}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {job.viewCount} views
                  </div>
                  <div>{job.applicantCount} applications</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={job.isActive ? "default" : "secondary"}>
                    {job.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {job.isFeatured && (
                    <Badge variant="destructive">Featured</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditJob(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateJob} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input
                              id="title"
                              value={editFormData.title}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                title: e.target.value
                              })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              value={editFormData.company}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                company: e.target.value
                              })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Select
                              value={editFormData.location}
                              onValueChange={(value) => setEditFormData({
                                ...editFormData,
                                location: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
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
                              value={editFormData.salary}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                salary: e.target.value
                              })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Job Type</Label>
                            <Select
                              value={editFormData.type}
                              onValueChange={(value) => setEditFormData({
                                ...editFormData,
                                type: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
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
                              value={editFormData.category}
                              onValueChange={(value) => setEditFormData({
                                ...editFormData,
                                category: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Agriculture">Agriculture</SelectItem>
                                <SelectItem value="Tourism">Tourism</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Construction">Construction</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              description: e.target.value
                            })}
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="requirements">Requirements</Label>
                          <Textarea
                            id="requirements"
                            value={editFormData.requirements}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              requirements: e.target.value
                            })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="benefits">Benefits</Label>
                          <Textarea
                            id="benefits"
                            value={editFormData.benefits}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              benefits: e.target.value
                            })}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isActive"
                              checked={editFormData.isActive}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                isActive: e.target.checked
                              })}
                              className="rounded"
                            />
                            <Label htmlFor="isActive">Active</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isFeatured"
                              checked={editFormData.isFeatured}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                isFeatured: e.target.checked
                              })}
                              className="rounded"
                            />
                            <Label htmlFor="isFeatured">Featured</Label>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline">
                              Cancel
                            </Button>
                          </DialogTrigger>
                          <Button type="submit" disabled={updateJobMutation.isPending}>
                            {updateJobMutation.isPending ? "Updating..." : "Update Job"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job)}
                    disabled={deleteJobMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {jobs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No job postings found.
        </div>
      )}
    </div>
  );
}