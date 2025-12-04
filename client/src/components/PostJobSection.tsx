import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, Shield, Plus } from "lucide-react";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PILI_BARANGAYS } from "@shared/barangays";

const JOB_CATEGORIES = [
  "Education",
  "Healthcare",
  "Retail",
  "Food Service",
  "Transportation",
  "Construction",
  "Agriculture",
  "Government",
  "Technology",
  "Manufacturing",
  "Tourism",
  "Banking & Finance",
  "Real Estate",
  "Security",
  "Customer Service",
  "Sales & Marketing",
  "Administrative",
  "Engineering",
  "Legal",
  "Beauty & Wellness",
  "Entertainment",
  "Non-Profit",
  "Consulting",
  "Media & Communications",
  "Other"
];

export default function PostJobSection() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const { isAuthenticated } = useAuth();

  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    category: "",
    salary: "",
    description: "",
    email: ""
  });

  const handlePostJobClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setShowJobForm(true);
    }
  };

  const updateForm = (field: string, value: string) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log("Job form submitted:", jobForm);
  };



  return (
    <>
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">For Employers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Post your job openings and connect with qualified local talent in Pili, Camarines Sur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Easy Job Posting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Create detailed job listings in minutes with our simple form
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Local Talent Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Access qualified candidates from Pili and surrounding areas
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Application Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Manage applications and communicate with candidates efficiently
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">SMS Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Get instant alerts when qualified candidates apply for your jobs
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="px-8 py-3 text-lg"
              onClick={handlePostJobClick}
            >
              Post a Job
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              Join local employers finding great talent in Pili
            </p>
          </div>

          {/* Job Posting Form */}
          {showJobForm && isAuthenticated && (
            <div className="mt-12">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Post a Job Opening
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="Your Company"
                          value={jobForm.company}
                          onChange={(e) => updateForm("company", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Location *</Label>
                        <Select value={jobForm.location} onValueChange={(value) => updateForm("location", value)}>
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
                      <div>
                        <Label>Job Type *</Label>
                        <Select value={jobForm.type} onValueChange={(value) => updateForm("type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category *</Label>
                        <Select value={jobForm.category} onValueChange={(value) => updateForm("category", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job category" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Salary Range (Monthly)</Label>
                        <Select value={jobForm.salary} onValueChange={(value) => updateForm("salary", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select salary range" />
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

                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1">
                        Post Job Opening
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowJobForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}