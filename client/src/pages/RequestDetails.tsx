import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  "Pending Approval": "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant",
  "Approved": "bg-secondary-container text-on-secondary-container",
  "On Hold": "bg-muted text-muted-foreground",
  "Revision Required": "bg-destructive/10 text-destructive",
  "Clarification Needed": "bg-yellow-100 text-yellow-900",
  "Ready to Publish": "bg-secondary-container text-on-secondary-container",
};

export default function RequestDetails() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/request/:requestId");
  const requestId = params?.requestId;

  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [comment, setComment] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const { data: request, isLoading } = trpc.workflow.getRequest.useQuery(
    { requestId: requestId || "" },
    { enabled: !!requestId }
  );

  const updateStatusMutation = trpc.workflow.updateStatus.useMutation();
  const addCommentMutation = trpc.workflow.addComment.useMutation();
  const sendUpdateMutation = trpc.workflow.sendUpdate.useMutation();

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !requestId) return;

    setIsSubmittingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        requestId,
        newStatus: newStatus as any,
        note: statusNote,
      });
      toast.success("Status updated successfully");
      setNewStatus("");
      setStatusNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !requestId) return;

    setIsSubmittingComment(true);
    try {
      await addCommentMutation.mutateAsync({ requestId, comment });
      toast.success("Comment added");
      setComment("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage || !requestId) return;

    setIsSubmittingUpdate(true);
    try {
      await sendUpdateMutation.mutateAsync({ requestId, message: updateMessage });
      toast.success("Update sent to team");
      setUpdateMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send update");
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <p className="text-center text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const canUpdateStatus = user?.role === "Admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="headline-md">{request.requestId}</h1>
            <Badge className={STATUS_COLORS[request.status] || "bg-muted"}>
              {request.status}
            </Badge>
          </div>
          <p className="body-md text-muted-foreground">{request.requestType}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Request Details */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="title-md">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="label-md text-muted-foreground">From</p>
                  <p className="body-md font-medium">{request.senderName}</p>
                  <p className="body-sm text-muted-foreground">{request.senderEmail}</p>
                </div>
                <div>
                  <p className="label-md text-muted-foreground">Assigned To</p>
                  <p className="body-md font-medium">{request.assigneeName}</p>
                  <p className="body-sm text-muted-foreground">{request.assigneeEmail}</p>
                </div>
              </div>

              {request.notes && (
                <div>
                  <p className="label-md text-muted-foreground">Notes</p>
                  <p className="body-md">{request.notes}</p>
                </div>
              )}

              {request.mediaLink && (
                <div>
                  <p className="label-md text-muted-foreground">Media Link</p>
                  <a
                    href={request.mediaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    View Media
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="label-md text-muted-foreground">Created</p>
                  <p className="body-md">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="label-md text-muted-foreground">Last Updated</p>
                  <p className="body-md">
                    {new Date(request.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="title-md">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {request.activities && request.activities.length > 0 ? (
                <div className="space-y-4">
                  {request.activities.map((activity, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-secondary" />
                        {idx < request.activities.length - 1 && (
                          <div className="mt-2 h-8 w-0.5 bg-outline-variant/20" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="label-md">{activity.action}</p>
                        <p className="body-sm text-muted-foreground">
                          {activity.actorName} • {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.note && <p className="body-md mt-2">{activity.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Status Update */}
          {canUpdateStatus && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="title-md">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div className="space-y-2">
                    <label className="label-md">New Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="input-ghost">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Revision Required">Revision Required</SelectItem>
                        <SelectItem value="Clarification Needed">Clarification Needed</SelectItem>
                        <SelectItem value="Ready to Publish">Ready to Publish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="statusNote" className="label-md">
                      Note (Optional)
                    </label>
                    <Textarea
                      id="statusNote"
                      placeholder="Add a note about this status change..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      disabled={isSubmittingStatus}
                      className="input-ghost min-h-20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingStatus || !newStatus}
                    className="w-full bg-primary text-on-primary hover:opacity-90"
                  >
                    {isSubmittingStatus ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add Comment */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="title-md">Add Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isSubmittingComment}
                  className="input-ghost min-h-20"
                />
                <Button
                  type="submit"
                  disabled={isSubmittingComment || !comment}
                  className="w-full bg-primary text-on-primary hover:opacity-90"
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Comment"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Send Update */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="title-md">Send Update</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendUpdate} className="space-y-4">
                <Textarea
                  placeholder="Send a team update..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  disabled={isSubmittingUpdate}
                  className="input-ghost min-h-20"
                />
                <Button
                  type="submit"
                  disabled={isSubmittingUpdate || !updateMessage}
                  className="w-full bg-secondary text-on-secondary hover:opacity-90"
                >
                  {isSubmittingUpdate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Update"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
