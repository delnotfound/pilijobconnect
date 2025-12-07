import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LOCATION_OPTIONS, JOB_CATEGORIES } from "@shared/barangays";
import PiliBackground from "@assets/Pili.jpeg";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
}

// Define the type for stats
interface Stats {
  activeJobs: number;
  employers: number;
  hiredThisMonth: number;
  jobSeekers: number;
  totalJobs: number;
  totalApplications: number;
}

// Function to fetch stats data
const fetchStats = async (): Promise<Stats> => {
  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
};

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
}: HeroSectionProps) {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: fetchStats,
  });

  const handleSearch = () => {
    // Scroll to jobs section
    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="text-white relative"
      style={{
        backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.7), rgba(29, 78, 216, 0.7)), url(${PiliBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Find Your Next Opportunity in{" "}
            <span className="text-blue-200">Pili</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Connect with local employers and discover job opportunities right
            here in Camarines Sur
          </p>

          {/* Main Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  What job are you looking for?
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="e.g. Teacher, Driver, Sales Assistant"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_OPTIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary-600 md:self-end"
              >
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 text-center">
            <div>
              <div className="text-3xl font-bold">{stats?.activeJobs || 0}</div>
              <div className="text-blue-200">Active Jobs</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats?.employers || 0}</div>
              <div className="text-blue-200">Local Employers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {stats?.hiredThisMonth || 0}
              </div>
              <div className="text-blue-200">Hired This Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats?.jobSeekers || 0}</div>
              <div className="text-blue-200">Job Seekers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}