import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserManagement } from "@/components/admin/UserManagement";
import { JobManagement } from "@/components/admin/JobManagement";
import { VerificationManagement } from "@/components/admin/VerificationManagement";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  pendingApplications: number;
  featuredJobs: number;
  totalEmployers: number;
  totalJobSeekers: number;
  applicationsToday: number;
  jobsPostedToday: number;
  usersRegisteredToday: number;
  jobViewsToday: number;
}

interface CategoryStats {
  category: string;
  jobCount: number;
  applicationCount: number;
  avgSalary: string;
}

interface JobTypeStats {
  type: string;
  count: number;
  percentage: number;
}

interface ApplicationTrend {
  date: string;
  applications: number;
  jobs: number;
}

interface RecentActivity {
  id: number;
  type: "application" | "job_posted" | "user_registered";
  message: string;
  timestamp: string;
}

interface InDemandJob {
  title: string;
  totalApplications: number;
  totalPostings: number;
  companiesHiring: number;
}

interface InDemandSkill {
  skill: string;
  demandFromEmployers: number;
  availableFromSeekers: number;
  gap: number;
}

interface SalaryTrends {
  categoryAverages: {
    category: string;
    averageSalary: number;
    minSalary: number;
    maxSalary: number;
    jobCount: number;
  }[];
  monthlyTrends: {
    month: string;
    categories: {
      category: string;
      averageSalary: number;
    }[];
  }[];
}

interface PesoStats {
  placementRate: number;
  totalApplications: number;
  totalHired: number;
  localEmploymentRate: number;
  totalLocalJobs: number;
  totalJobs: number;
  monthlyStats: {
    month: string;
    applications: number;
    hired: number;
    jobs: number;
    newSeekers: number;
    placementRate: number;
  }[];
  categoryHiring: {
    category: string;
    applications: number;
    hired: number;
    rate: number;
  }[];
}

const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for more real-time feel
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
    gcTime: 0, // Don't cache old data
  });

  const { data: categoryStats = [] } = useQuery<CategoryStats[]>({
    queryKey: ["/api/admin/category-stats"],
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: jobTypeStats = [] } = useQuery<JobTypeStats[]>({
    queryKey: ["/api/admin/job-type-stats"],
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: trends = [] } = useQuery<ApplicationTrend[]>({
    queryKey: ["/api/admin/trends"],
    refetchInterval: 15000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ["/api/admin/recent-activity"],
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/applications"],
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
  });

  // New Analytics Queries
  const { data: inDemandJobs = [] } = useQuery<InDemandJob[]>({
    queryKey: ["/api/admin/in-demand-jobs"],
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: inDemandSkills = [] } = useQuery<InDemandSkill[]>({
    queryKey: ["/api/admin/in-demand-skills"],
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: salaryTrends } = useQuery<SalaryTrends>({
    queryKey: ["/api/admin/salary-trends"],
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: pesoStats } = useQuery<PesoStats>({
    queryKey: ["/api/admin/peso-stats"],
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
  });

  const seedDatabaseMutation = useMutation({
    mutationFn: () => apiRequest("/api/seed", "POST", {}),
    onSuccess: () => {
      toast({
        title: "Database Seeded",
        description: "Sample data has been added successfully",
      });
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Seeding Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearDatabaseMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/clear-data", "POST", {}),
    onSuccess: () => {
      toast({
        title: "Database Cleared",
        description: "All data has been removed",
      });
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Pili Jobs Analytics & Management
          </p>
        </div>
        <div className="space-x-2 z-30 relative">
          <Button
            variant="default"
            onClick={async () => {
              try {
                toast({
                  title: "Exporting Analytics",
                  description: "Generating your Excel file...",
                });

                const response = await fetch("/api/admin/export-analytics", {
                  credentials: "include",
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.message || "Export failed");
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `pili-jobs-analytics-${
                  new Date().toISOString().split("T")[0]
                }.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                  title: "Export Successful",
                  description: "Your Excel file has been downloaded",
                });
              } catch (error) {
                toast({
                  title: "Export Failed",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Failed to export analytics",
                  variant: "destructive",
                });
              }
            }}
          >
            Export to Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => seedDatabaseMutation.mutate()}
            disabled={seedDatabaseMutation.isPending}
          >
            Seed Database
          </Button>
          <Button
            variant="destructive"
            onClick={() => clearDatabaseMutation.mutate()}
            disabled={clearDatabaseMutation.isPending}
          >
            Clear Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{stats?.usersRegisteredToday || 0}
              </span>{" "}
              registered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">
                +{stats?.jobsPostedToday || 0}
              </span>{" "}
              posted today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalApplications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-purple-600">
                +{stats?.applicationsToday || 0}
              </span>{" "}
              applications today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.jobViewsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">
                +{stats?.jobViewsToday || 0}
              </span>{" "}
              views today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.featuredJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Premium listings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Jobs by Category</CardTitle>
                <CardDescription>
                  Distribution of job postings by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={categoryStats}
                    margin={{ bottom: 80, left: 10, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="jobCount" fill="#8884d8" name="Jobs Posted" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Job Type Distribution */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Job Types</CardTitle>
                <CardDescription>
                  Distribution by employment type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobTypeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {jobTypeStats?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card> */}

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>
                  Jobs posted, Applications received, and User registrations
                  over time (Last 30 days) - Job views are tracked in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={
                      trends && trends.length > 0
                        ? trends
                        : [
                            {
                              date: "No Data",
                              applications: 0,
                              jobs: 0,
                              users: 0,
                            },
                          ]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      label={{
                        value: "Date",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                      }}
                    />
                    <Tooltip
                      labelStyle={{ color: "#333" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                      formatter={(value, name) => {
                        const labels = {
                          applications: "Applications",
                          jobs: "Jobs Posted",
                          users: "User Registrations",
                        };
                        return [
                          value,
                          labels[name as keyof typeof labels] || name,
                        ];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Applications"
                    />
                    <Area
                      type="monotone"
                      dataKey="jobs"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Jobs Posted"
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="3"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.6}
                      name="User Registrations"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {(!trends || trends.length === 0) && (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground absolute inset-0"></div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PESO Statistics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Placement Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {pesoStats?.placementRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {pesoStats?.totalHired || 0} hired out of{" "}
                  {pesoStats?.totalApplications || 0} applications
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of applications that resulted in successful hiring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Local Employment
                </CardTitle>
                <MapPin className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {pesoStats?.localEmploymentRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {pesoStats?.totalLocalJobs || 0} local jobs out of{" "}
                  {pesoStats?.totalJobs || 0} total
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Jobs located in Pili, Camarines Sur area
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hired
                </CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {pesoStats?.totalHired || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully placed job seekers
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Job seekers who found employment through Pili Jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Job Seekers
                </CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.totalJobSeekers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered job seekers on platform
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Looking for employment opportunities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Employment Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Employment Trends (PESO Report)</CardTitle>
              <CardDescription>
                Track monthly applications, hires, job postings, and new job
                seeker registrations. This data helps assess the employment
                landscape and PESO program effectiveness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={pesoStats?.monthlyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        applications: "Applications Received",
                        hired: "Successful Placements",
                        jobs: "Jobs Posted",
                        newSeekers: "New Job Seekers",
                      };
                      return [value, labels[name as string] || name];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="applications"
                    name="Applications"
                    fill="#8884d8"
                  />
                  <Bar dataKey="hired" name="Hired" fill="#82ca9d" />
                  <Bar dataKey="jobs" name="Jobs Posted" fill="#ffc658" />
                  <Bar dataKey="newSeekers" name="New Seekers" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Compare applications vs hires to
                  identify conversion efficiency. A healthy job market shows
                  steady growth in both job postings and new seekers.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* In-Demand Jobs and Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Most In-Demand Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Most In-Demand Jobs</CardTitle>
                <CardDescription>
                  Top job titles by number of applications received. Shows which
                  positions are most sought after by job seekers in Pili,
                  Camarines Sur.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={inDemandJobs.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="title"
                      type="category"
                      width={150}
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          totalApplications: "Total Applications",
                          totalPostings: "Job Postings",
                          companiesHiring: "Companies Hiring",
                        };
                        return [value, labels[name as string] || name];
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalApplications"
                      name="Applications"
                      fill="#8884d8"
                    />
                    <Bar
                      dataKey="totalPostings"
                      name="Postings"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> High application-to-posting ratio
                    indicates competitive positions. Jobs with many postings but
                    few applications may need better visibility.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Most In-Demand Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Demand vs Supply Analysis</CardTitle>
                <CardDescription>
                  Compares skills demanded by employers vs skills available from
                  job seekers. Positive gap means shortage, negative means
                  surplus.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={inDemandSkills.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="skill"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        {
                          demandFromEmployers: "Employer Demand (Job Postings)",
                          availableFromSeekers: "Available (Job Seekers)",
                          gap: "Skills Gap",
                        }[name as string] || name,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="demandFromEmployers"
                      name="Demand"
                      fill="#ff8042"
                    />
                    <Bar
                      dataKey="availableFromSeekers"
                      name="Supply"
                      fill="#00C49F"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Skills with high demand but low
                    supply indicate training opportunities. PESO can focus skill
                    development programs on these gap areas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Trends by Category (Last 3 Months)</CardTitle>
              <CardDescription>
                Average salary ranges across job categories. Helps job seekers
                understand market rates and employers benchmark their offerings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salaryTrends?.categoryAverages || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `₱${value.toLocaleString()}`,
                      "",
                    ]}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="averageSalary"
                    name="Average Salary"
                    fill="#8884d8"
                  />
                  <Bar dataKey="minSalary" name="Min Salary" fill="#82ca9d" />
                  <Bar dataKey="maxSalary" name="Max Salary" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Wide salary ranges may indicate
                  varied experience requirements. Categories with higher
                  averages typically require specialized skills.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Hiring Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Hiring Success Rate by Category</CardTitle>
              <CardDescription>
                Percentage of applications that result in successful hiring per
                job category. Higher rates indicate better candidate-job
                matching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pesoStats?.categoryHiring &&
              pesoStats.categoryHiring.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pesoStats.categoryHiring}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "rate")
                            return [`${value}%`, "Success Rate"];
                          if (name === "applications")
                            return [value, "Total Applications"];
                          if (name === "hired") return [value, "Total Hired"];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="rate"
                        name="Success Rate (%)"
                        fill="#82ca9d"
                      />
                      <Bar
                        dataKey="applications"
                        name="Applications"
                        fill="#8884d8"
                      />
                      <Bar dataKey="hired" name="Hired" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Low success rates may indicate
                      misaligned expectations or skill gaps. Consider focused
                      training for underperforming categories.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">
                      No hiring data available yet
                    </p>
                    <p className="text-sm">
                      Applications need to be marked as "hired" to show in this
                      chart
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === "application" && (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      {activity.type === "job_posted" && (
                        <Briefcase className="h-5 w-5 text-green-500" />
                      )}
                      {activity.type === "user_registered" && (
                        <UserCheck className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Edit users, update roles, and manage access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement users={users || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>
                Edit job postings, update details, and manage featured listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobManagement jobs={jobs || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <VerificationManagement />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {/* Database Management Section (Placeholder for now) */}
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Manage database seeding and clearing operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => seedDatabaseMutation.mutate()}
                  disabled={seedDatabaseMutation.isPending}
                >
                  Seed Database
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => clearDatabaseMutation.mutate()}
                  disabled={clearDatabaseMutation.isPending}
                >
                  Clear Data
                </Button>
              </div>
              <p className="text-center text-muted-foreground mt-4">
                Use with caution. Seeding adds sample data, clearing removes all
                data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Management</CardTitle>
              <CardDescription>All job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications?.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {app.firstName} {app.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {app.email} • {app.phone}
                      </p>
                      <p className="text-sm text-blue-600">
                        Applied for: {app.jobTitle}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          app.status === "accepted"
                            ? "default"
                            : app.status === "rejected"
                            ? "destructive"
                            : app.status === "reviewed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {app.status}
                      </Badge>
                      {app.smsNotificationSent && (
                        <MessageSquare className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
