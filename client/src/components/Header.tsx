import { useState } from "react";
import { Menu, User, LogOut, Settings } from "lucide-react";
import piliLogo from "@assets/pili-logo.png";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import UserProfileModal from "@/components/UserProfileModal";

interface HeaderProps {
  userType: "seeker" | "employer";
  setUserType: (type: "seeker" | "employer") => void;
}

export default function Header({ userType, setUserType }: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // State for the profile modal
  const { user, isAuthenticated, logout } = useAuth();

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user?.email || "User";
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b z-30 relative">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img src={piliLogo} alt="Pili Seal" className="w-8 h-8" />
                <h1 className="text-xl font-bold text-gray-900">Pili Jobs</h1>
              </div>
              <span className="hidden sm:inline text-sm text-gray-500">Camarines Sur</span>
            </div>

            {/* Navigation removed - dashboards are shown based on user role */}

            <div className="flex items-center space-x-3">
              {!isAuthenticated && (
                <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={userType === "seeker" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setUserType("seeker")}
                    className={userType === "seeker" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}
                  >
                    Job Seeker
                  </Button>
                  <Button
                    variant={userType === "employer" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setUserType("employer")}
                    className={userType === "employer" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}
                  >
                    Employer
                  </Button>
                </div>
              )}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{getUserDisplayName()}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.role?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfileModal(true)} data-profile-edit> {/* Changed to open profile modal and added data attribute */}
                      <User className="mr-2 h-4 w-4" /> {/* Replaced Settings icon with User icon */}
                      <span>Edit Profile</span> {/* Changed text to Edit Profile */}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}

              <Button variant="ghost" size="sm" className="md:hidden p-2 text-gray-600">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userType={userType}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}