import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import JobListings from "@/components/JobListings";
import EmployerSection from "@/components/EmployerSection";
import PostJobSection from "@/components/PostJobSection";
import Footer from "@/components/Footer";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { EmployerDashboard } from "@/pages/EmployerDashboard";
import { JobSeekerApplications } from "@/components/JobSeekerApplications";
import JobSeekerDashboard from "@/components/JobSeekerDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import PiliBackground from "@assets/Pili.jpeg";

export default function Home() {
  const [userType, setUserType] = useState<"seeker" | "employer">("seeker");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("Pili (All Areas)");
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show role-based dashboards for authenticated users
  if (isAuthenticated && user) {
    // Admin Dashboard
    if (user.role === "admin") {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header userType={userType} setUserType={setUserType} />
          <AdminDashboard />
          <Footer />
        </div>
      );
    }
    
    // Employer Dashboard
    if (user.role === "employer") {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header userType={userType} setUserType={setUserType} />
          <EmployerDashboard />
          <Footer />
        </div>
      );
    }
    
    // Job Seeker - Show regular job listings with navigation to applications
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.95), rgba(249, 250, 251, 0.95)), url(${PiliBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Header userType={userType} setUserType={setUserType} />
        <JobSeekerDashboard 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
        />
        <Footer />
      </div>
    );
  }

  // Show different content based on user type for logged out users
  if (userType === "employer") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userType={userType} setUserType={setUserType} />
        <div 
          className="text-white py-16 relative"
          style={{
            backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.8), rgba(29, 78, 216, 0.8)), url(${PiliBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">Post Jobs & Find Talent</h2>
            <p className="text-xl text-blue-100 mb-8">
              Connect with qualified job seekers in Pili, Camarines Sur
            </p>
          </div>
        </div>
        <PostJobSection />
        <Footer />
      </div>
    );
  }

  // Regular job board interface for job seekers
  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.95), rgba(249, 250, 251, 0.95)), url(${PiliBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Header userType={userType} setUserType={setUserType} />
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
      <PostJobSection />
      <Footer />
    </div>
  );
}
