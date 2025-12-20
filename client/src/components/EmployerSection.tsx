import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Clock, TrendingUp, Shield, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { InsertJob } from "@shared/schema";
import { PILI_BARANGAYS } from "@shared/barangays";



export default function EmployerSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, canPostJobs } = useAuth();

  const [jobForm, setJobForm] = useState<InsertJob>({
    title: "",
    company: "",
    location: "Pili Centro",
    type: "Full-time",
    category: "Education",
    salary: "₱15,000 - ₱20,000",
    description: "",
    email: "",
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: InsertJob) => {
      return await apiRequest("/api/jobs", "POST", jobData);
    },
    onSuccess: () => {
      toast({
        title: "Job Posted Successfully",
        description: "Your job posting is now live and visible to job seekers.",
      });
      setJobForm({
        title: "",
        company: "",
        location: "Pili Centro",
        type: "Full-time",
        category: "Education",
        salary: "₱15,000 - ₱20,000",
        description: "",
        email: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobForm.title || !jobForm.company || !jobForm.description || !jobForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate(jobForm);
  };

  const updateForm = (field: keyof InsertJob, value: string) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="employers" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">For Employers</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Post your job openings and connect with qualified local talent in Pili, Camarines Sur
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Local Talent</h3>
                <p className="text-gray-600">
                  Connect with qualified job seekers right here in Pili and surrounding areas.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="text-green-500 h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Job Posting</h3>
                <p className="text-gray-600">
                  Post your job openings in minutes with our simple, intuitive form.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-orange-500 h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Management</h3>
                <p className="text-gray-600">
                  Manage applications and communicate directly with candidates.
                </p>
              </div>
            </div>
          </div>

          {/* Job Posting Form */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Post a Job
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!isAuthenticated ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please log in to post a job. Only registered employers can create job listings.
                  </AlertDescription>
                </Alert>
              ) : !canPostJobs ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Only employers and administrators can post jobs. Your account is currently registered as a job seeker.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g. Marketing Manager"
                    value={jobForm.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your company name"
                    value={jobForm.company}
                    onChange={(e) => updateForm("company", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Job Type</Label>
                    <Select value={jobForm.type} onValueChange={(value) => updateForm("type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={jobForm.category} onValueChange={(value) => updateForm("category", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                </div>

                <div>
                  <Label>Location</Label>
                  <Select value={jobForm.location} onValueChange={(value) => updateForm("location", value)}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Salary Range (Monthly)</Label>
                  <Select value={jobForm.salary} onValueChange={(value) => updateForm("salary", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₱15,000 - ₱20,000">₱15,000 - ₱20,000</SelectItem>
                      <SelectItem value="₱20,000 - ₱30,000">₱20,000 - ₱30,000</SelectItem>
                      <SelectItem value="₱30,000 - ₱50,000">₱30,000 - ₱50,000</SelectItem>
                      <SelectItem value="₱50,000+">₱50,000+</SelectItem>
                      <SelectItem value="Negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the role, requirements, and responsibilities..."
                    value={jobForm.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.com"
                    value={jobForm.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    required
                  />
                </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? "Posting..." : "Post Job Opening"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}