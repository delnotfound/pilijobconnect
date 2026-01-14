import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PILI_BARANGAYS } from "@shared/barangays";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { FileText, X, Upload } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    skills: "",
    desiredRoles: "",
    experienceLevel: "",
    preferredLocation: "",
    resume: "",
    coverLetter: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (user && isOpen) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        skills: user.skills || "",
        desiredRoles: user.desiredRoles || "",
        experienceLevel: user.experienceLevel || "",
        preferredLocation: user.preferredLocation || "",
        resume: user.resume || "",
        coverLetter: user.coverLetter || "",
      });
      setResumeFile(null);
      setCoverLetterFile(null);
    }
  }, [user, isOpen]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending profile update with:", {
        resume: data.resume
          ? `${String(data.resume).substring(0, 50)}...`
          : "undefined",
        coverLetter: data.coverLetter
          ? `${String(data.coverLetter).substring(0, 50)}...`
          : "undefined",
      });
      return await apiRequest("/api/auth/profile", "PUT", data);
    },
    onSuccess: async (response) => {
      console.log("Profile update response:", {
        resume: response.user.resume
          ? `${String(response.user.resume).substring(0, 50)}...`
          : "undefined",
        coverLetter: response.user.coverLetter
          ? `${String(response.user.coverLetter).substring(0, 50)}...`
          : "undefined",
      });

      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/jobseeker/recommendations"],
      });

      toast({
        title: "Success",
        description:
          "Profile updated successfully! Your job recommendations will be updated.",
      });

      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = profileSchema.parse(profileData);

      // Only validate job preference fields for job seekers
      const jobPreferenceErrors: any = {};
      if (user?.role === "jobseeker") {
        if (!profileData.skills || profileData.skills.trim() === "") {
          jobPreferenceErrors.skills =
            "Skills are required for job recommendations";
        }
        if (
          !profileData.desiredRoles ||
          profileData.desiredRoles.trim() === ""
        ) {
          jobPreferenceErrors.desiredRoles =
            "Desired roles are required for job recommendations";
        }
        if (
          !profileData.experienceLevel ||
          profileData.experienceLevel === ""
        ) {
          jobPreferenceErrors.experienceLevel =
            "Experience level is required for job recommendations";
        }
        if (
          !profileData.preferredLocation ||
          profileData.preferredLocation === ""
        ) {
          jobPreferenceErrors.preferredLocation =
            "Preferred location is required for job recommendations";
        }

        if (Object.keys(jobPreferenceErrors).length > 0) {
          setErrors(jobPreferenceErrors);
          return;
        }
      }

      // Handle file uploads and convert to base64
      let resumeBase64 = profileData.resume;
      let coverLetterBase64 = profileData.coverLetter;

      if (resumeFile) {
        resumeBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(resumeFile);
        });
      }

      if (coverLetterFile) {
        coverLetterBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(coverLetterFile);
        });
      }

      // Include job preference fields only for job seekers
      const completeData =
        user?.role === "jobseeker"
          ? {
              ...validatedData,
              skills: profileData.skills,
              desiredRoles: profileData.desiredRoles,
              experienceLevel: profileData.experienceLevel,
              preferredLocation: profileData.preferredLocation,
              resume: resumeBase64 || undefined,
              coverLetter: coverLetterBase64 || undefined,
            }
          : {
              ...validatedData,
              resume: resumeBase64 || undefined,
              coverLetter: coverLetterBase64 || undefined,
            };

      updateProfileMutation.mutate(completeData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, or text file",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      setResumeFile(file);
    }
  };

  const handleCoverLetterFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Cover letter file must be smaller than 2MB",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      const allowedTypes = [
        "text/plain",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a TXT, PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        if (e.target) e.target.value = "";
        return;
      }

      setCoverLetterFile(file);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setProfileData((prev) => ({ ...prev, resume: "" }));
  };

  const removeCoverLetter = () => {
    setCoverLetterFile(null);
    setProfileData((prev) => ({ ...prev, coverLetter: "" }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                +63
              </span>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) =>
                  handleInputChange("phone", e.target.value.replace(/\s+/g, ""))
                }
                placeholder="9171234567"
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Select
              value={profileData.address || ""}
              onValueChange={(value) => handleInputChange("address", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your barangay" />
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

          {user?.role === "jobseeker" && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Application Documents
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your resume and cover letter to auto-attach them when
                  applying for jobs
                </p>
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">Resume/CV</Label>
                {!resumeFile && !profileData.resume ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto text-gray-400 h-6 w-6 mb-2" />
                    <label
                      htmlFor="resumeUpload"
                      className="text-sm text-primary cursor-pointer hover:underline"
                    >
                      Upload Resume
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT (Max 5MB)
                    </p>
                    <input
                      id="resumeUpload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {resumeFile?.name || "Resume uploaded"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeResume}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Cover Letter Upload */}
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                {!coverLetterFile && !profileData.coverLetter ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto text-gray-400 h-6 w-6 mb-2" />
                    <label
                      htmlFor="coverLetterUpload"
                      className="text-sm text-primary cursor-pointer hover:underline"
                    >
                      Upload Cover Letter
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT (Max 2MB)
                    </p>
                    <input
                      id="coverLetterUpload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleCoverLetterFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {coverLetterFile?.name || "Cover letter uploaded"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCoverLetter}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Job Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete your profile to get personalized job recommendations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">
                  Skills <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="skills"
                  value={profileData.skills}
                  onChange={(e) => handleInputChange("skills", e.target.value)}
                  placeholder="e.g., React, PHP, Customer Service, Data Entry"
                  className={errors.skills ? "border-red-500" : ""}
                />
                {errors.skills && (
                  <p className="text-sm text-red-500">{errors.skills}</p>
                )}
                <p className="text-xs text-gray-500">
                  Enter your skills separated by commas. Be specific!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredRoles">
                  Desired Job Roles <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="desiredRoles"
                  value={profileData.desiredRoles}
                  onChange={(e) =>
                    handleInputChange("desiredRoles", e.target.value)
                  }
                  placeholder="e.g., Web Developer, Marketing Assistant, Sales Associate"
                  className={errors.desiredRoles ? "border-red-500" : ""}
                />
                {errors.desiredRoles && (
                  <p className="text-sm text-red-500">{errors.desiredRoles}</p>
                )}
                <p className="text-xs text-gray-500">
                  What positions are you looking for? Separate multiple roles
                  with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">
                  Experience Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={profileData.experienceLevel || ""}
                  onValueChange={(value) =>
                    handleInputChange("experienceLevel", value)
                  }
                >
                  <SelectTrigger
                    className={errors.experienceLevel ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry">
                      Entry Level (0-2 years)
                    </SelectItem>
                    <SelectItem value="Mid">Mid Level (3-5 years)</SelectItem>
                    <SelectItem value="Senior">
                      Senior Level (6+ years)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.experienceLevel && (
                  <p className="text-sm text-red-500">
                    {errors.experienceLevel}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocation">
                  Preferred Work Location{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={profileData.preferredLocation || ""}
                  onValueChange={(value) =>
                    handleInputChange("preferredLocation", value)
                  }
                >
                  <SelectTrigger
                    className={errors.preferredLocation ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your preferred barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any Location">
                      Any Location in Pili
                    </SelectItem>
                    {PILI_BARANGAYS.map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredLocation && (
                  <p className="text-sm text-red-500">
                    {errors.preferredLocation}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  This helps us recommend jobs near you
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending
                ? "Updating..."
                : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
