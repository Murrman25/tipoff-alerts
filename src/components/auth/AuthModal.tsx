import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { EmailAuthForm } from "./EmailAuthForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleBack = () => {
    setShowEmailForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Save Your Alert</DialogTitle>
          <DialogDescription>
            Sign in or create an account to save this alert and get notified when conditions match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!showEmailForm ? (
            <>
              <SocialAuthButtons />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 text-base border-border bg-secondary/50 hover:bg-secondary"
                onClick={() => {
                  setEmailMode("signin");
                  setShowEmailForm(true);
                }}
              >
                <Mail className="w-5 h-5 mr-3" />
                Continue with Email
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setEmailMode("signup");
                    setShowEmailForm(true);
                  }}
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                ← Back
              </Button>

              <EmailAuthForm mode={emailMode} onSuccess={handleSuccess} />

              <p className="text-center text-sm text-muted-foreground">
                {emailMode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setEmailMode("signup")}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setEmailMode("signin")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
