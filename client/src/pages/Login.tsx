import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success("Successfully logged in!");
      const result = await refresh();
      if (result.data) {
        setLocation("/");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerMutation.mutateAsync({ email, fullName, password });
      toast.success("Registration successful! Your account is pending admin approval.");
      setEmail("");
      setPassword("");
      setFullName("");
      setStep("login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register");
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
    setLocation("/");
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
              {step === "login"
                ? "Sign in to access the workflow management system"
                : "Create a new account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email_login" className="label-md">
                    Email Address
                  </label>
                  <Input
                    id="email_login"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password_login" className="label-md">
                    Password
                  </label>
                  <Input
                    id="password_login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("register");
                    setPassword("");
                  }}
                  disabled={isSubmitting}
                >
                  Create an Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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

                <div className="space-y-2">
                  <label htmlFor="email_register" className="label-md">
                    Email Address
                  </label>
                  <Input
                    id="email_register"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password_register" className="label-md">
                    Password
                  </label>
                  <Input
                    id="password_register"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="input-ghost"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Register"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("login")}
                  disabled={isSubmitting}
                >
                  Back to Sign In
                </Button>
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
