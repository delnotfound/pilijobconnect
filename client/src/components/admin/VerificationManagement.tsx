
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download,
  FileText,
  Building,
  User,
  Mail,
  Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function VerificationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any>(null);

  // Fetch pending verification requests
  const { data: verificationRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/verification-requests'],
  });

  const approveVerificationMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/admin/verification/${userId}/approve`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employer verification approved!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve verification",
        variant: "destructive"
      });
    }
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/admin/verification/${userId}/reject`, 'POST', { reason: "Documents not acceptable" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employer verification rejected!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject verification",
        variant: "destructive"
      });
    }
  });

  const fetchDocumentsMutation = useMutation({
    mutationFn: (userId: number) => apiRequest(`/api/admin/verification/${userId}/documents`, 'GET'),
    onSuccess: (data) => {
      setDocuments(data);
      setDocumentsModalOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive"
      });
    }
  });

  const handleViewDocuments = (user: any) => {
    setSelectedUser(user);
    fetchDocumentsMutation.mutate(user.id);
  };

  const downloadDocument = (documentData: string, filename: string) => {
    if (documentData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = documentData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employer Verification</h2>
          <p className="text-muted-foreground">Manage employer verification requests</p>
        </div>
        <Badge variant="secondary">
          {verificationRequests.length} pending
        </Badge>
      </div>

      {verificationRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending verifications</h3>
            <p className="text-muted-foreground">
              All employer verification requests have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verificationRequests.map((user: any) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge variant="outline">Pending Verification</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {user.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Submitted: {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocuments(user)}
                      disabled={fetchDocumentsMutation.isPending}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Documents
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => approveVerificationMutation.mutate(user.id)}
                      disabled={approveVerificationMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectVerificationMutation.mutate(user.id)}
                      disabled={rejectVerificationMutation.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents Modal */}
      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Verification Documents - {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {documents && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Barangay Permit
                  </h4>
                  {documents.barangayPermit ? (
                    <div className="border rounded p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(documents.barangayPermit, `${selectedUser?.firstName}_${selectedUser?.lastName}_barangay_permit`)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No document uploaded</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Business Permit
                  </h4>
                  {documents.businessPermit ? (
                    <div className="border rounded p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(documents.businessPermit, `${selectedUser?.firstName}_${selectedUser?.lastName}_business_permit`)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No document uploaded</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    rejectVerificationMutation.mutate(selectedUser?.id);
                    setDocumentsModalOpen(false);
                  }}
                  disabled={rejectVerificationMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    approveVerificationMutation.mutate(selectedUser?.id);
                    setDocumentsModalOpen(false);
                  }}
                  disabled={approveVerificationMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
