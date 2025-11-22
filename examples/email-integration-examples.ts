/**
 * Example Integration: Sending Invite Emails
 * 
 * This file demonstrates how to integrate the email sending functionality
 * into your existing invite system.
 */

// ============================================================================
// EXAMPLE 1: Update the createOrganizationInvite action to auto-send emails
// ============================================================================

// File: lib/actions/invites.ts
// Add this after successfully creating an invite:

/*
import { sendInviteEmail } from "@/lib/utils/email";

export async function createOrganizationInvite(input: CreateInviteInput) {
  // ... existing code to create invite ...
  
  if (data) {
    // Get organization details
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", input.org_id)
      .single();

    // Get inviter details
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    // Send invite email (non-blocking)
    sendInviteEmail({
      inviteId: data.id,
      email: input.email,
      organizationName: orgData?.name || "the organization",
      inviterName: userData?.display_name || userData?.email || "A team member",
      role: input.role,
      inviteToken: token,
    }).catch(err => {
      console.error("Failed to send invite email:", err);
      // Don't fail the invite creation if email fails
    });

    return { success: true, data };
  }
}
*/

// ============================================================================
// EXAMPLE 2: Send email from the InviteMembersModal component
// ============================================================================

// File: components/organizations/invite-members-modal.tsx
// Update the handleSubmit function:

/*
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    // Create the invite
    const result = await createOrganizationInvite({
      org_id: organizationId,
      email: email.trim(),
      role,
    });

    if (result.success && result.data) {
      // Send the email
      const emailResult = await sendInviteEmail({
        inviteId: result.data.id,
        email: email.trim(),
        organizationName: organizationName,
        inviterName: "You", // or get from user context
        role: role,
        inviteToken: result.data.token,
      });

      if (emailResult.success) {
        setSuccess(`Invite sent to ${email}`);
      } else {
        setSuccess(`Invite created (email sending failed: ${emailResult.error})`);
      }

      setEmail("");
      onSuccess?.();
      router.refresh();

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Failed to send invite");
    }
  } catch (err) {
    console.error("Error sending invite:", err);
    setError("An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};
*/

// ============================================================================
// EXAMPLE 3: Create a dedicated email sending action
// ============================================================================

// File: lib/actions/email.ts
/*
"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendOrganizationInviteEmail(inviteId: string) {
  try {
    const supabase = await createClient();

    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(`
        id,
        email,
        role,
        token,
        organizations(name),
        invited_by_user:user_profiles!organization_invites_invited_by_fkey(display_name)
      `)
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Invite not found" };
    }

    // Call the API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteId: invite.id,
        email: invite.email,
        organizationName: invite.organizations?.name || "the organization",
        inviterName: invite.invited_by_user?.display_name || "A team member",
        role: invite.role,
        inviteToken: invite.token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
*/

// ============================================================================
// EXAMPLE 4: Resend failed emails (bulk operation)
// ============================================================================

/*
"use server";

export async function resendPendingInviteEmails(organizationId: string) {
  const supabase = await createClient();

  // Get all pending invites that haven't been emailed
  const { data: invites } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("org_id", organizationId)
    .eq("status", "pending")
    .eq("email_sent", false)
    .lt("expires_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!invites || invites.length === 0) {
    return { success: true, count: 0 };
  }

  let successCount = 0;
  let failCount = 0;

  for (const invite of invites) {
    const result = await sendOrganizationInviteEmail(invite.id);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  return {
    success: true,
    count: successCount,
    failed: failCount,
    total: invites.length,
  };
}
*/

// ============================================================================
// EXAMPLE 5: React Hook for sending invites with email
// ============================================================================

/*
// File: hooks/use-invite-member.ts
import { useState } from "react";
import { createOrganizationInvite } from "@/lib/actions/invites";
import { sendInviteEmail } from "@/lib/utils/email";
import { toast } from "react-hot-toast";

export function useInviteMember(organizationId: string, organizationName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteMember = async (email: string, role: string) => {
    setLoading(true);
    setError(null);

    try {
      // Create invite
      const inviteResult = await createOrganizationInvite({
        org_id: organizationId,
        email: email.trim(),
        role,
      });

      if (!inviteResult.success) {
        throw new Error(inviteResult.error || "Failed to create invite");
      }

      // Send email
      const emailResult = await sendInviteEmail({
        inviteId: inviteResult.data.id,
        email: email.trim(),
        organizationName: organizationName,
        inviterName: "Team",
        role: role,
        inviteToken: inviteResult.data.token,
      });

      if (emailResult.success) {
        toast.success(`Invite sent to ${email}`);
      } else {
        toast.success("Invite created, but email failed to send");
        console.error("Email error:", emailResult.error);
      }

      return { success: true, invite: inviteResult.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { inviteMember, loading, error };
}
*/

// ============================================================================
// EXAMPLE 6: Using the hook in a component
// ============================================================================

/*
"use client";

import { useInviteMember } from "@/hooks/use-invite-member";

export function InviteForm({ organizationId, organizationName }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const { inviteMember, loading } = useInviteMember(organizationId, organizationName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await inviteMember(email, role);
    if (result.success) {
      setEmail("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" disabled={loading || !email}>
        {loading ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}
*/

// ============================================================================
// EXAMPLE 7: Scheduled email reminders (advanced)
// ============================================================================

/*
// File: app/api/cron/send-invite-reminders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/utils/email";

export async function GET(request: Request) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Find invites created 3 days ago that are still pending
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: invites } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("status", "pending")
    .gte("created_at", threeDaysAgo.toISOString())
    .lt("created_at", new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (!invites || invites.length === 0) {
    return NextResponse.json({ message: "No reminders to send" });
  }

  let sent = 0;
  for (const invite of invites) {
    // Send reminder email (customize the template for reminders)
    const result = await sendInviteEmail({
      inviteId: invite.id,
      email: invite.email,
      organizationName: "Organization", // Get from DB
      inviterName: "Team",
      role: invite.role,
      inviteToken: invite.token,
    });

    if (result.success) sent++;
  }

  return NextResponse.json({
    message: `Sent ${sent} reminder emails`,
    total: invites.length,
  });
}
*/

export {};
