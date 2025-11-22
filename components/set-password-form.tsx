"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { acceptOrganizationInvite } from "@/lib/actions/invites";
import { Lock, CheckCircle } from "lucide-react";

export function SetPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Update user's password and clear the needs_password_setup flag
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          needs_password_setup: false, // Clear the flag
        },
      });

      if (updateError) throw updateError;

      // If there's an invite token, accept it automatically
      if (inviteToken) {
        const acceptResult = await acceptOrganizationInvite(inviteToken);

        if (acceptResult.success && acceptResult.data) {
          router.push(`/protected/organizations/${acceptResult.data.org_id}`);
          return;
        } else {
          // If auto-accept fails, redirect to invite page
          router.push(`/invite/${inviteToken}`);
          return;
        }
      }

      // No invite, redirect to protected area
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
          <CardDescription className="text-center">
            Choose a secure password to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword}>
            <div className="flex flex-col gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  💡 Your password should be at least 6 characters long and contain a mix of letters and numbers for
                  better security.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">At least 6 characters</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Setting password..."
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Set Password & Continue
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
