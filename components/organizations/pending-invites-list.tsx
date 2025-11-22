"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrganizationInvites, cancelOrganizationInvite, resendOrganizationInvite } from "@/lib/actions/invites";
import type { OrganizationInvite, InviteStatus } from "@/lib/types/organization";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

interface PendingInvitesListProps {
  organizationId: string;
}

export function PendingInvitesList({ organizationId }: PendingInvitesListProps) {
  const router = useRouter();
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<OrganizationInvite | null>(null);

  useEffect(() => {
    loadInvites();
  }, [organizationId]);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const result = await getOrganizationInvites(organizationId);
      if (result.success && result.data) {
        setInvites(result.data);
      }
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const result = await cancelOrganizationInvite(inviteId);
      if (result.success) {
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        setInviteToCancel(null);
        toast.success("Invitation cancelled successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to cancel invite");
      }
    } catch (error) {
      console.error("Error canceling invite:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const result = await resendOrganizationInvite(inviteId);
      if (result.success) {
        toast.success("Invite resent successfully!");
        await loadInvites();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to resend invite");
      }
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: InviteStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "declined":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: InviteStatus) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "accepted":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "declined":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "expired":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return (
      <div className="p-8 text-center">
        <Mail className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-600 dark:text-neutral-400">No invites sent yet</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">Invite members to start collaborating</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {invites.map((invite, index) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{invite.email}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1",
                      getStatusColor(invite.status)
                    )}
                  >
                    {getStatusIcon(invite.status)}
                    {invite.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Role:</span>
                    {invite.role}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Sent:</span>
                    {formatDate(invite.created_at)}
                  </span>
                  {invite.status === "pending" && (
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        isExpired(invite.expires_at) && "text-red-600 dark:text-red-400 font-medium"
                      )}
                    >
                      <span className="font-medium">Expires:</span>
                      {formatDate(invite.expires_at)}
                      {isExpired(invite.expires_at) && " (Expired)"}
                    </span>
                  )}
                  {invite.responded_at && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Responded:</span>
                      {formatDate(invite.responded_at)}
                    </span>
                  )}
                </div>
              </div>

              {invite.status === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invite.id)}
                    disabled={actionLoading === invite.id}
                    className="text-xs"
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-1", actionLoading === invite.id && "animate-spin")} />
                    Resend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteToCancel(invite)}
                    disabled={actionLoading === invite.id}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cancel Invite Confirmation */}
      <AlertDialog
        open={!!inviteToCancel}
        onOpenChange={(open) => !open && setInviteToCancel(null)}
        title="Cancel Invitation?"
        description={`Are you sure you want to cancel the invitation for ${inviteToCancel?.email}? They will no longer be able to accept this invitation.`}
        actionLabel="Cancel Invite"
        onAction={() => inviteToCancel && handleCancel(inviteToCancel.id)}
        isDestructive
        isLoading={actionLoading === inviteToCancel?.id}
      />
    </>
  );
}
