
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiRequest } from "@/lib/queryClient";

interface ActivityData {
  date: string;
  jobsPosted: number;
  applications: number;
  newUsers: number;
}

export default function ActivityTrends() {
  const { data: activityData, isLoading } = useQuery({
    queryKey: ["/api/admin/activity-trends"],
    queryFn: () => apiRequest("/api/admin/activity-trends", "GET"),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            Loading activity data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activityData || activityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No activity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [value, name === 'jobsPosted' ? 'Jobs Posted' : name === 'applications' ? 'Applications' : 'New Users']}
              />
              <Line 
                type="monotone" 
                dataKey="jobsPosted" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Jobs Posted"
              />
              <Line 
                type="monotone" 
                dataKey="applications" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Applications"
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
