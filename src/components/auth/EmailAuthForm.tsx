import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface EmailAuthFormProps {
  mode: "signin" | "signup";
  onSuccess?: () => void;
}

export const EmailAuthForm = ({ mode, onSuccess }: EmailAuthFormProps) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      let error;
      if (mode === "signin") {
        error = await signInWithEmail(email, password);
      } else {
        error = await signUpWithEmail(email, password);
      }

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists. Try signing in.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please check your email to confirm your account");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (mode === "signup") {
        toast.success("Check your email to confirm your account");
      } else {
        toast.success("Signed in successfully!");
        onSuccess?.();
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-secondary/50 border-border"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-secondary/50 border-border"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base bg-amber-gradient text-primary-foreground hover:opacity-90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {mode === "signin" ? "Signing in..." : "Creating account..."}
          </>
        ) : (
          <>{mode === "signin" ? "Sign In" : "Create Account"}</>
        )}
      </Button>
    </form>
  );
};
