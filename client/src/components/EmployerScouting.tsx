
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, MapPin, Briefcase, Mail, Phone, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PILI_BARANGAYS } from "@shared/barangays";

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  skills: string | null;
  desiredRoles: string | null;
  experienceLevel: string | null;
  preferredLocation: string | null;
  matchScore: number;
  matchingSkills: string[];
}

export default function EmployerScouting() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    skills: "",
    experienceLevel: "",
    location: "",
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const scoutMutation = useMutation({
    mutationFn: async (params: { skills: string[]; experienceLevel?: string; location?: string }) =>
      apiRequest("/api/employer/scout-candidates", "POST", params),
    onSuccess: (data) => {
      setCandidates(data);
      setHasSearched(true);
      toast({
        title: "Search Complete",
        description: `Found ${data.length} matching candidate${data.length !== 1 ? 's' : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to scout candidates",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    const skillsArray = searchParams.skills
      .split(",")
      .map(s => s.trim())
      .filter(s => s);

    if (skillsArray.length === 0) {
      toast({
        title: "Skills Required",
        description: "Please enter at least one skill to search",
        variant: "destructive",
      });
      return;
    }

    scoutMutation.mutate({
      skills: skillsArray,
      experienceLevel: searchParams.experienceLevel || undefined,
      location: searchParams.location || undefined,
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Scout Candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skills">
              Required Skills <span className="text-red-500">*</span>
            </Label>
            <Input
              id="skills"
              value={searchParams.skills}
              onChange={(e) => setSearchParams({ ...searchParams, skills: e.target.value })}
              placeholder="e.g., React, Customer Service, Sales (comma-separated)"
            />
            <p className="text-xs text-gray-500">
              Enter skills you're looking for, separated by commas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level (Optional)</Label>
              <Select
                value={searchParams.experienceLevel || "any"}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, experienceLevel: value === "any" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Experience</SelectItem>
                  <SelectItem value="Entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="Mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="Senior">Senior Level (6+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Preferred Location (Optional)</Label>
              <Select
                value={searchParams.location || "any"}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, location: value === "any" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Location</SelectItem>
                  {PILI_BARANGAYS.map((barangay) => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={scoutMutation.isPending}
            className="w-full"
          >
            <Search className="mr-2 h-4 w-4" />
            {scoutMutation.isPending ? "Searching..." : "Search Candidates"}
          </Button>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Found
            </h3>
          </div>

          {candidates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No candidates found matching your criteria. Try adjusting your search parameters.
              </CardContent>
            </Card>
          ) : (
            candidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary-100 rounded-full p-2">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                          <Badge className={getMatchColor(candidate.matchScore)}>
                            {candidate.matchScore}% Match
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {candidate.phone}
                          </div>
                        )}
                        {candidate.preferredLocation && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {candidate.preferredLocation}
                          </div>
                        )}
                        {candidate.experienceLevel && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Award className="h-4 w-4" />
                            {candidate.experienceLevel} Level
                          </div>
                        )}
                      </div>

                      {candidate.matchingSkills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Matching Skills:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.matchingSkills.map((skill, idx) => (
                              <Badge key={idx} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.desiredRoles && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Desired Roles:
                          </p>
                          <p className="text-sm text-gray-600">{candidate.desiredRoles}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
