"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { acceptOrganizationInvite, getInviteByToken } from "@/lib/actions/invites";

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const router = useRouter();

  // Load invite details if token exists
  useEffect(() => {
    if (inviteToken) {
      getInviteByToken(inviteToken).then((result) => {
        if (result.success && result.data) {
          setEmail(result.data.invite.email);
          setOrganizationName(result.data.organization.name);
        }
      });
    }
  }, [inviteToken]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: inviteToken
            ? `${window.location.origin}/invite/${inviteToken}`
            : `${window.location.origin}/protected`,
        },
      });

      if (signUpError) throw signUpError;

      // If there's an invite token, accept it automatically
      if (inviteToken) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const acceptResult = await acceptOrganizationInvite(inviteToken);

          if (acceptResult.success) {
            router.push(`/protected/organizations/${acceptResult.data?.org_id}`);
            return;
          } else {
            // If auto-accept fails, redirect to invite page
            router.push(`/invite/${inviteToken}`);
            return;
          }
        }
      }

      router.push("/auth/sign-up-success");
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
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            {organizationName ? `Create an account to join ${organizationName}` : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!inviteToken}
                />
                {inviteToken && <p className="text-xs text-neutral-500">This email is from your invitation</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href={inviteToken ? `/auth/login?invite=${inviteToken}` : "/auth/login"}
                className="underline underline-offset-4"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
