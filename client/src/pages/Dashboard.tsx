import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  "Pending Approval": "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant",
  "Approved": "bg-secondary-container text-on-secondary-container",
  "On Hold": "bg-muted text-muted-foreground",
  "Revision Required": "bg-destructive/10 text-destructive",
  "Clarification Needed": "bg-yellow-100 text-yellow-900",
  "Ready to Publish": "bg-secondary-container text-on-secondary-container",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: requests, isLoading } = trpc.workflow.getAllRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Calculate status counts
  const statusCounts = useMemo(() => {
    if (!requests) return {};
    return requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [requests]);

  // Filter requests by selected status
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!selectedStatus) return requests;
    return requests.filter((req) => req.status === selectedStatus);
  }, [requests, selectedStatus]);

  const canCreateRequest = user?.role === "Admin" || user?.role === "Marketing";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="headline-md">Dashboard</h1>
          <p className="body-md text-muted-foreground">Marketing Approval Workflow</p>
        </div>
        {canCreateRequest && (
          <Button
            onClick={() => navigate("/create-request")}
            className="bg-primary text-on-primary hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          "Pending Approval",
          "Approved",
          "On Hold",
          "Revision Required",
          "Clarification Needed",
          "Ready to Publish",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
            className={`rounded-lg p-4 text-center transition-all ${
              selectedStatus === status
                ? "bg-primary text-on-primary shadow-lg"
                : "bg-card text-foreground border border-border hover:border-primary"
            }`}
          >
            <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
            <div className="text-xs font-medium">{status}</div>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="title-md">
            {selectedStatus ? `${selectedStatus} Requests` : "All Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="body-md text-muted-foreground">
                {selectedStatus
                  ? `No requests with status "${selectedStatus}"`
                  : "No requests yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <button
                  key={request.requestId}
                  onClick={() => navigate(`/request/${request.requestId}`)}
                  className="flex w-full items-start justify-between gap-4 rounded-lg border border-border bg-surface-container-low p-4 transition-all hover:border-primary hover:bg-surface-container"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="title-md font-semibold">{request.requestId}</span>
                      <Badge className={STATUS_COLORS[request.status] || "bg-muted"}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="body-sm text-muted-foreground">{request.requestType}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="body-sm">
                        From: <span className="font-medium">{request.senderName}</span>
                      </span>
                      <span className="body-sm">
                        To: <span className="font-medium">{request.assigneeName}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="body-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
