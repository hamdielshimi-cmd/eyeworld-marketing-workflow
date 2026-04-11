import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: users, isLoading } = trpc.users.getAll.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation();
  const updateStatusMutation = trpc.users.updateAccessStatus.useMutation();

  if (user?.role !== "Admin") {
    return (
      <div className="space-y-6">
        <h1 className="headline-md">Settings</h1>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="body-md text-muted-foreground">
              Only administrators can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    setIsUpdatingRole(true);
    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUserId,
        role: selectedRole as "Admin" | "Marketing" | "Viewer",
      });
      toast.success("Role updated successfully");
      setSelectedUserId(null);
      setSelectedRole("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedUserId || !selectedStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        userId: selectedUserId,
        status: selectedStatus as "Active" | "Pending" | "Inactive",
      });
      toast.success("Access status updated successfully");
      setSelectedUserId(null);
      setSelectedStatus("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const currentUser = users?.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="headline-md">Settings</h1>
        <p className="body-md text-muted-foreground">Manage users and permissions</p>
      </div>

      {/* Users Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="title-md">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1">
                    <p className="title-md font-semibold">{u.name}</p>
                    <p className="body-sm text-muted-foreground">{u.email}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge className="bg-primary text-on-primary">{u.role}</Badge>
                      <Badge
                        className={
                          u.accessStatus === "Active"
                            ? "bg-secondary text-on-secondary"
                            : u.accessStatus === "Pending"
                              ? "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant"
                              : "bg-destructive text-destructive-foreground"
                        }
                      >
                        {u.accessStatus}
                      </Badge>
                    </div>
                  </div>

                  {selectedUserId === u.id ? (
                    <div className="space-y-3 md:w-64">
                      {/* Role Selection */}
                      <div className="space-y-2">
                        <label className="label-md">Role</label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger className="input-ghost">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Selection */}
                      <div className="space-y-2">
                        <label className="label-md">Access Status</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="input-ghost">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateRole}
                          disabled={isUpdatingRole || !selectedRole}
                          className="flex-1 bg-primary text-on-primary hover:opacity-90"
                          size="sm"
                        >
                          {isUpdatingRole ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Update Role"
                          )}
                        </Button>
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={isUpdatingStatus || !selectedStatus}
                          className="flex-1 bg-secondary text-on-secondary hover:opacity-90"
                          size="sm"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Update Status"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUserId(null);
                            setSelectedRole("");
                            setSelectedStatus("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setSelectedRole(u.role);
                        setSelectedStatus(u.accessStatus);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No users found</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border bg-surface-container">
        <CardHeader>
          <CardTitle className="title-md">User Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="label-md">Admin</p>
            <p className="body-sm text-muted-foreground">
              Can approve requests, manage users, and access all features
            </p>
          </div>
          <div>
            <p className="label-md">Marketing</p>
            <p className="body-sm text-muted-foreground">
              Can create and manage requests, add comments, and send updates
            </p>
          </div>
          <div>
            <p className="label-md">Viewer</p>
            <p className="body-sm text-muted-foreground">
              Can view all requests and activity, but cannot create or modify them
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
