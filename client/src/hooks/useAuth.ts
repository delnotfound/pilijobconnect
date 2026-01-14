import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "jobseeker" | "employer" | "admin";
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  resume?: string;
  coverLetter?: string;
  skills?: string;
  desiredRoles?: string;
  experienceLevel?: string;
  preferredLocation?: string;
  isActive?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canPostJobs, setCanPostJobs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await apiRequest("/api/auth/me", "GET");
        setUser(response.user);
        setIsAuthenticated(true);
        setCanPostJobs(
          response.user.role === "employer" || response.user.role === "admin"
        );
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setCanPostJobs(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("/api/auth/login", "POST", {
        email,
        password,
      });
      setUser(response.user);
      setIsAuthenticated(true);
      setCanPostJobs(
        response.user.role === "employer" || response.user.role === "admin"
      );
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role: "jobseeker" | "employer";
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    try {
      const response = await apiRequest("/api/auth/register", "POST", userData);
      setUser(response.user);
      setIsAuthenticated(true);
      setCanPostJobs(
        response.user.role === "employer" || response.user.role === "admin"
      );
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", "POST");
    } catch {
      // Continue with logout even if API call fails
    } finally {
      // Clear all user state immediately
      setUser(null);
      setIsAuthenticated(false);
      setCanPostJobs(false);
      setIsLoading(false);

      // Force page reload to ensure clean state
      window.location.reload();
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiRequest("/api/auth/me", "GET");
      console.log("refreshUser response:", {
        resume: response.user.resume
          ? `${String(response.user.resume).substring(0, 50)}...`
          : "undefined",
        coverLetter: response.user.coverLetter
          ? `${String(response.user.coverLetter).substring(0, 50)}...`
          : "undefined",
      });
      setUser(response.user);
      setIsAuthenticated(true);
      setCanPostJobs(
        response.user.role === "employer" || response.user.role === "admin"
      );
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setCanPostJobs(false);
    }
  };

  return {
    user,
    isAuthenticated,
    canPostJobs,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
