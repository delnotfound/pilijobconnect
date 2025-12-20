import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Phone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
}

export function UserManagement({ users }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "",
    isActive: true,
    isVerified: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: number; userData: any }) =>
      apiRequest(`/api/admin/users/${data.id}`, "PUT", data.userData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/users/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: editFormData,
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (
      window.confirm(
        `Are you sure you want to delete user ${user.firstName} ${user.lastName}?`
      )
    ) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "employer":
        return "default";
      case "job_seeker":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {user.phone || "Not provided"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {(user.isVerified ||
                    user.verificationStatus === "approved") && (
                    <Badge variant="outline">Verified</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog
                    open={editingUser?.id === user.id}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={editFormData.firstName}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  firstName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={editFormData.lastName}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  lastName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+63 912 345 6789"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={editFormData.role}
                            onValueChange={(value) =>
                              setEditFormData({
                                ...editFormData,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="job_seeker">
                                Job Seeker
                              </SelectItem>
                              <SelectItem value="employer">Employer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isActive"
                              checked={editFormData.isActive}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  isActive: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="isActive">Active</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isVerified"
                              checked={editFormData.isVerified}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  isVerified: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="isVerified">Verified</Label>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateUserMutation.isPending}
                          >
                            {updateUserMutation.isPending
                              ? "Updating..."
                              : "Update User"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
