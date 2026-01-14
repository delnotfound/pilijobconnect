import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Briefcase, Heart, UserCircle } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import JobListings from "@/components/JobListings";
import { JobSeekerApplications } from "@/components/JobSeekerApplications";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedJobs from "@/components/SavedJobs";
import UserProfileModal from "./UserProfileModal";
import RecommendedJobs from "@/components/RecommendedJobs"; // Assuming this component exists

interface JobSeekerDashboardProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
}

export default function JobSeekerDashboard({
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter
}: JobSeekerDashboardProps) {
  const [activeView, setActiveView] = useState<"browse" | "applications">("browse");
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false); // State to control modal visibility

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "User";
  };

  // Check if user profile is incomplete
  const isProfileIncomplete = !user?.skills || !user?.desiredRoles || !user?.experienceLevel || !user?.preferredLocation;

  if (activeView === "applications") {
    return (
      <div>
        <div className="bg-primary text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {getUserDisplayName()}!</h1>
                <p className="text-primary-foreground/80">Track your job applications and find new opportunities</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setActiveView("browse")}
                className="bg-white text-primary hover:bg-gray-100"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </div>
          </div>
        </div>
        <JobSeekerApplications />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {getUserDisplayName()}!</h1>
          <p className="text-muted-foreground">Find your next opportunity in Pili, Camarines Sur</p>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {isProfileIncomplete && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Complete your profile to see job match percentages
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Add your skills, desired roles, experience level, and preferred location to see how well each job matches your profile.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowProfileModal(true)} // Open the modal
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Complete Profile Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommended" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended">
          <RecommendedJobs onOpenProfileModal={() => setShowProfileModal(true)} />
        </TabsContent>

        <TabsContent value="browse">
          <div className="space-y-6">
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
            />
            <JobListings
              searchQuery={searchQuery}
              locationFilter={locationFilter}
            />
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <SavedJobs />
        </TabsContent>

        <TabsContent value="applications">
          <JobSeekerApplications />
        </TabsContent>
      </Tabs>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user} // Pass the user object to the modal
      />
    </div>
  );
}