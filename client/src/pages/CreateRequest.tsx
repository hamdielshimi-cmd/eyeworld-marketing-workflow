import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateRequest() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    assigneeName: "",
    assigneeEmail: "",
    requestType: "",
    mediaLink: "",
    notes: "",
  });

  const createRequestMutation = trpc.workflow.createRequest.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assigneeName || !formData.assigneeEmail || !formData.requestType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRequestMutation.mutateAsync(formData);
      toast.success(`Request ${result.requestId} created successfully!`);
      navigate(`/request/${result.requestId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        <div>
          <h1 className="headline-md">Create Request</h1>
          <p className="body-md text-muted-foreground">Submit a new approval request</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="title-md">Request Details</CardTitle>
          <CardDescription className="body-sm">
            Fill in the details below to create a new workflow request
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <label htmlFor="requestType" className="label-md">
                Request Type *
              </label>
              <Input
                id="requestType"
                name="requestType"
                type="text"
                placeholder="e.g., Social Media Post, Email Campaign, Blog Article"
                value={formData.requestType}
                onChange={handleChange}
                disabled={isSubmitting}
                className="input-ghost"
              />
            </div>

            {/* Assignee Name */}
            <div className="space-y-2">
              <label htmlFor="assigneeName" className="label-md">
                Assignee Name *
              </label>
              <Input
                id="assigneeName"
                name="assigneeName"
                type="text"
                placeholder="Who should review this?"
                value={formData.assigneeName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="input-ghost"
              />
            </div>

            {/* Assignee Email */}
            <div className="space-y-2">
              <label htmlFor="assigneeEmail" className="label-md">
                Assignee Email *
              </label>
              <Input
                id="assigneeEmail"
                name="assigneeEmail"
                type="email"
                placeholder="assignee@example.com"
                value={formData.assigneeEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                className="input-ghost"
              />
            </div>

            {/* Media Link */}
            <div className="space-y-2">
              <label htmlFor="mediaLink" className="label-md">
                Media Link
              </label>
              <Input
                id="mediaLink"
                name="mediaLink"
                type="url"
                placeholder="https://example.com/media"
                value={formData.mediaLink}
                onChange={handleChange}
                disabled={isSubmitting}
                className="input-ghost"
              />
              <p className="body-sm text-muted-foreground">
                Link to the media asset or content for review
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="label-md">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any additional context or instructions..."
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                className="input-ghost min-h-24"
              />
            </div>

            {/* Sender Info (Display Only) */}
            <div className="rounded-lg bg-surface-container p-4">
              <p className="body-sm text-muted-foreground">
                <span className="font-medium">Submitting as:</span> {user?.name} ({user?.email})
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-on-primary hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Request"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
