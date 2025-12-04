import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Clock, TrendingUp, Shield, AlertTriangle, Plus, Briefcase, MapPin, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { PILI_BARANGAYS } from "@shared/barangays";

interface EmployerPreviewSectionProps {
  onLoginRequired: () => void;
}

export default function EmployerPreviewSection({ onLoginRequired }: EmployerPreviewSectionProps) {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [previewJob, setPreviewJob] = useState({
    title: "Sales Associate",
    company: "Sample Store",
    location: "Pili Centro",
    type: "Full-time",
    category: "Retail",
    salary: "₱15,000 - ₱20,000",
    description: "We are looking for a friendly and enthusiastic Sales Associate to join our team in Pili Centro.",
  });

  const handlePostJob = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      {/* Hero Section for Employers */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Find the Perfect Candidate in{" "}
              <span className="text-green-200">Pili</span>
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Connect with talented job seekers in Camarines Sur and grow your business with the right people
            </p>

            {/* Stats for Employers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50+</div>
                <p className="text-green-200">Job Seekers</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">25+</div>
                <p className="text-green-200">Applications Daily</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">90%</div>
                <p className="text-green-200">Response Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24hrs</div>
                <p className="text-green-200">Average Response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Posting Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Post Your Job in Minutes
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Reach qualified candidates in Pili, Camarines Sur with our easy-to-use job posting platform
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Job Posting Form Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Create Job Posting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preview-title">Job Title</Label>
                      <Input
                        id="preview-title"
                        value={previewJob.title}
                        onChange={(e) => setPreviewJob({...previewJob, title: e.target.value})}
                        placeholder="e.g. Sales Associate"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preview-company">Company Name</Label>
                      <Input
                        id="preview-company"
                        value={previewJob.company}
                        onChange={(e) => setPreviewJob({...previewJob, company: e.target.value})}
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preview-location">Location</Label>
                      <Select value={previewJob.location} onValueChange={(value) => setPreviewJob({...previewJob, location: value})}>
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
                      <Label htmlFor="preview-type">Job Type</Label>
                      <Select value={previewJob.type} onValueChange={(value) => setPreviewJob({...previewJob, type: value})}>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preview-category">Category</Label>
                      <Select value={previewJob.category} onValueChange={(value) => setPreviewJob({...previewJob, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Food Service">Food Service</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Agriculture">Agriculture</SelectItem>
                          <SelectItem value="Government">Government</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="preview-salary">Salary Range</Label>
                      <Select value={previewJob.salary} onValueChange={(value) => setPreviewJob({...previewJob, salary: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="₱15,000 - ₱20,000">₱15,000 - ₱20,000</SelectItem>
                          <SelectItem value="₱20,000 - ₱30,000">₱20,000 - ₱30,000</SelectItem>
                          <SelectItem value="₱30,000 - ₱50,000">₱30,000 - ₱50,000</SelectItem>
                          <SelectItem value="₱50,000+">₱50,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preview-description">Job Description</Label>
                    <Textarea
                      id="preview-description"
                      value={previewJob.description}
                      onChange={(e) => setPreviewJob({...previewJob, description: e.target.value})}
                      rows={4}
                      placeholder="Describe the job requirements and responsibilities..."
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This is a preview. To post a real job, please log in as an employer.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handlePostJob}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Post Job Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h4>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase className="text-green-600 h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 hover:text-green-600 cursor-pointer">
                            {previewJob.title}
                          </h4>
                          <p className="text-gray-600 mb-2">{previewJob.company}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4" />
                              {previewJob.location}
                            </span>
                            <span className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              {previewJob.type}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" />
                              {previewJob.salary}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {previewJob.category}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {previewJob.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" disabled>
                        Save
                      </Button>
                      <Button disabled>
                        Apply Now
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-600 text-sm">{previewJob.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">Preview - Posted just now</span>
                      <span className="text-xs text-green-600 font-medium flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        0 applicants
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Pili Jobs for Hiring?
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Local Talent Pool</h4>
              <p className="text-gray-600">
                Access qualified candidates from Pili and surrounding areas in Camarines Sur
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Quick Responses</h4>
              <p className="text-gray-600">
                Get applications within hours and hire faster with our streamlined process
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">SMS Notifications</h4>
              <p className="text-gray-600">
                Get instant SMS alerts when candidates apply to your job postings
              </p>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}