"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Mail, User, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptOrganizationInvite, declineOrganizationInvite } from "@/lib/actions/invites";
import { getDisplayName } from "@/lib/utils/user-helpers";
import type { InviteInfo } from "@/lib/types/organization";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface InviteAcceptanceClientProps {
  inviteInfo: InviteInfo;
  user: SupabaseUser | null;
  token: string;
}

export function InviteAcceptanceClient({ inviteInfo, user, token }: InviteAcceptanceClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const { invite, organization, inviter_profile } = inviteInfo;
  const inviterName = getDisplayName(inviter_profile);

  const isExpired = new Date(invite.expires_at) < new Date();
  const isAlreadyResponded = invite.status !== "pending";

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login for non-authenticated users
      router.push(`/auth/login?invite=${token}`);
      return;
    }

    // Check if user's email matches the invite email
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      setError("This invite was sent to a different email address. Please sign in with the invited email.");
      return;
    }

    setLoading(true);
    setAction("accept");
    setError(null);

    try {
      const result = await acceptOrganizationInvite(token);

      if (result.success && result.data) {
        // Redirect to organization page
        router.push(`/protected/organizations/${result.data.org_id}`);
      } else {
        setError(result.error || "Failed to accept invite");
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    setLoading(true);
    setAction("decline");
    setError(null);

    try {
      const result = await declineOrganizationInvite(token);

      if (result.success) {
        setShowDeclineConfirm(false);
        router.push("/protected/organizations");
      } else {
        setError(result.error || "Failed to decline invite");
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">Organization Invitation</h1>
              <p className="text-center text-white/90">You've been invited to join an organization</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {isAlreadyResponded && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    This invite has already been {invite.status}.
                  </p>
                </div>
              )}

              {isExpired && invite.status === "pending" && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">This invite has expired.</p>
                </div>
              )}

              {/* Organization Details */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {organization.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{organization.name}</span>
                    </div>
                    {organization.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{organization.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">Invited by:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{inviterName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">Sent to:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{invite.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">Role:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">{invite.role}</span>
                  </div>

                  {!isExpired && invite.status === "pending" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-600 dark:text-neutral-400">Expires:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {formatDate(invite.expires_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Mismatch Warning */}
              {user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ This invite was sent to <strong>{invite.email}</strong> but you're signed in as{" "}
                    <strong>{user.email}</strong>. Please sign in with the invited email address.
                  </p>
                </div>
              )}

              {/* Authenticated Success Message */}
              {user &&
                user.email?.toLowerCase() === invite.email.toLowerCase() &&
                !isAlreadyResponded &&
                !isExpired && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      ✅ You're signed in as <strong>{user.email}</strong>. Ready to accept this invitation!
                    </p>
                  </div>
                )}

              {/* Actions */}
              {!isAlreadyResponded && !isExpired && (
                <div className="flex flex-col gap-3">
                  {user ? (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeclineConfirm(true)}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading && action === "decline" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Declining...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleAccept}
                        disabled={loading || user.email?.toLowerCase() !== invite.email.toLowerCase()}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                      >
                        {loading && action === "accept" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          You need to sign in with the invited email address to accept this invitation.
                        </p>
                      </div>
                      <Button
                        onClick={handleAccept}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sign In to Accept
                      </Button>
                    </>
                  )}
                </div>
              )}

              {(isAlreadyResponded || isExpired) && (
                <div className="flex justify-center">
                  <Link href={user ? "/protected/organizations" : "/"}>
                    <Button variant="outline">{user ? "Go to Organizations" : "Go to Home"}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decline Confirmation Dialog */}
      <AlertDialog
        open={showDeclineConfirm}
        onOpenChange={setShowDeclineConfirm}
        title="Decline Invitation?"
        description={`Are you sure you want to decline the invitation to join "${organization.name}"? You can always ask for a new invitation later.`}
        actionLabel="Decline Invitation"
        onAction={handleDecline}
        isDestructive
        isLoading={loading && action === "decline"}
      />
    </>
  );
}
