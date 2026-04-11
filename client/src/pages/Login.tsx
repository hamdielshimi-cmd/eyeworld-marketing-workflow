import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState<"choice" | "access-request">("choice");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestAccessMutation = trpc.workflow.requestAccess.useMutation();

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestAccessMutation.mutateAsync({ email, fullName });
      toast.success("Access request submitted! You will be notified once approved.");
      setEmail("");
      setFullName("");
      setStep("choice");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request access");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="display-lg mb-2">Eyeworld</h1>
          <p className="body-md text-muted-foreground">Marketing Approval Workflow</p>
        </div>

        {/* Main Card */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="headline-md">Welcome</CardTitle>
            <CardDescription className="body-md">
              {step === "choice"
                ? "Sign in to access the workflow management system"
                : "Request access to the system"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "choice" ? (
              <div className="space-y-4">
                {/* Sign In Button */}
                <a href={getLoginUrl()}>
                  <Button className="w-full bg-primary text-on-primary hover:opacity-90">
                    Sign In with Manus
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Request Access Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("access-request")}
                >
                  Request Access
                </Button>

                {/* Info Text */}
                <p className="body-sm text-center text-muted-foreground">
                  New to the system? Request access and an admin will review your request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-4">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="label-md">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="label-md">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("choice")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>

                {/* Info Text */}
                <p className="body-sm text-center text-muted-foreground">
                  Your request will be reviewed by an administrator. You'll receive an email once your access is approved.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="body-sm mt-8 text-center text-muted-foreground">
          © 2026 Eyeworld. All rights reserved.
        </p>
      </div>
    </div>
  );
}
