"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { OrganizationInvite, CreateInviteInput, InviteInfo } from "@/lib/types/organization";
import type { UserProfile } from "@/lib/types/user";

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generate a secure random token for invites
 */
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create an organization invite
 */
export async function createOrganizationInvite(input: CreateInviteInput): Promise<ActionResponse<OrganizationInvite>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { success: false, error: "Invalid email address" };
    }

    // Check if user has permission (owner or admin)
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", input.org_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "You are not a member of this organization" };
    }

    if (!["owner", "admin"].includes(memberData.role)) {
      return { success: false, error: "Only owners and admins can invite members" };
    }

    // Check if user is already a member (by email)
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id, user_id(email)")
      .eq("org_id", input.org_id);

    const memberEmails = existingMember?.map((m: any) => m.user_id?.email).filter(Boolean) || [];
    if (memberEmails.includes(input.email.toLowerCase())) {
      return { success: false, error: "This user is already a member of the organization" };
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from("organization_invites")
      .select("id")
      .eq("org_id", input.org_id)
      .eq("email", input.email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return { success: false, error: "An invite has already been sent to this email" };
    }

    // Generate token and expiration (7 days from now)
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite
    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        org_id: input.org_id,
        email: input.email.toLowerCase(),
        token,
        role: input.role,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite:", error);
      return { success: false, error: error.message };
    }

    // In production, send email here
    // For now, log the invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${token}`;
    console.log("📧 Invite created for:", input.email);
    console.log("🔗 Invite link:", inviteLink);
    console.log("⏰ Expires:", expiresAt.toISOString());

    revalidatePath(`/protected/organizations/${input.org_id}`);

    return { success: true, data };
  } catch (error) {
    console.error("Error in createOrganizationInvite:", error);
    return { success: false, error: "Failed to create invite" };
  }
}

/**
 * Get all invites for an organization
 */
export async function getOrganizationInvites(organizationId: string): Promise<ActionResponse<OrganizationInvite[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is a member
    const { data: memberCheck } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!memberCheck) {
      return { success: false, error: "Access denied" };
    }

    const { data, error } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations!organization_invites_org_id_fkey(id, name, description),
        inviter:user_profiles!organization_invites_invited_by_fkey(id, email, display_name, avatar_url)
      `
      )
      .eq("org_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invites:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getOrganizationInvites:", error);
    return { success: false, error: "Failed to fetch invites" };
  }
}

/**
 * Get invite by token with inviter profile
 */
export async function getInviteByToken(token: string): Promise<ActionResponse<InviteInfo>> {
  try {
    const supabase = await createClient();

    // Get invite with organization and inviter profile
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations!organization_invites_org_id_fkey(id, name, description, created_at, created_by, updated_at),
        inviter_profile:user_profiles!organization_invites_invited_by_fkey(id, email, display_name, avatar_url, created_at, updated_at)
      `
      )
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Invite not found" };
    }

    return {
      success: true,
      data: {
        invite: invite as any,
        organization: invite.organization as any,
        inviter_profile: invite.inviter_profile as UserProfile,
      },
    };
  } catch (error) {
    console.error("Error in getInviteByToken:", error);
    return { success: false, error: "Failed to fetch invite" };
  }
}

/**
 * Accept an organization invite
 */
export async function acceptOrganizationInvite(token: string): Promise<ActionResponse<{ org_id: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Call the database function to accept invite
    const { data, error } = await supabase.rpc("accept_organization_invite", {
      invite_token: token,
      user_id: user.id,
    });

    if (error) {
      console.error("Error accepting invite:", error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; org_id?: string };

    if (!result.success) {
      return { success: false, error: result.error || "Failed to accept invite" };
    }

    revalidatePath("/protected/organizations");
    revalidatePath(`/protected/organizations/${result.org_id}`);

    return { success: true, data: { org_id: result.org_id! } };
  } catch (error) {
    console.error("Error in acceptOrganizationInvite:", error);
    return { success: false, error: "Failed to accept invite" };
  }
}

/**
 * Decline an organization invite
 */
export async function declineOrganizationInvite(token: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Invite not found" };
    }

    // Verify user's email matches invite
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false, error: "This invite was sent to a different email address" };
    }

    // Update invite status
    const { error } = await supabase
      .from("organization_invites")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) {
      console.error("Error declining invite:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/protected/organizations/${invite.org_id}`);

    return { success: true };
  } catch (error) {
    console.error("Error in declineOrganizationInvite:", error);
    return { success: false, error: "Failed to decline invite" };
  }
}

/**
 * Cancel an invite (admin/owner only)
 */
export async function cancelOrganizationInvite(inviteId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("org_id")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Invite not found" };
    }

    // Check permission
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", invite.org_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "Access denied" };
    }

    if (!["owner", "admin"].includes(memberData.role)) {
      return { success: false, error: "Only owners and admins can cancel invites" };
    }

    // Delete invite
    const { error } = await supabase.from("organization_invites").delete().eq("id", inviteId);

    if (error) {
      console.error("Error canceling invite:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/protected/organizations/${invite.org_id}`);

    return { success: true };
  } catch (error) {
    console.error("Error in cancelOrganizationInvite:", error);
    return { success: false, error: "Failed to cancel invite" };
  }
}

/**
 * Resend an invite (generates new token and extends expiration)
 */
export async function resendOrganizationInvite(inviteId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return { success: false, error: "Invite not found" };
    }

    // Check permission
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", invite.org_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "Access denied" };
    }

    if (!["owner", "admin"].includes(memberData.role)) {
      return { success: false, error: "Only owners and admins can resend invites" };
    }

    // Generate new token and extend expiration
    const newToken = generateInviteToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { error } = await supabase
      .from("organization_invites")
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: "pending",
      })
      .eq("id", inviteId);

    if (error) {
      console.error("Error resending invite:", error);
      return { success: false, error: error.message };
    }

    // Log new invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${newToken}`;
    console.log("📧 Invite resent to:", invite.email);
    console.log("🔗 New invite link:", inviteLink);
    console.log("⏰ New expiration:", newExpiresAt.toISOString());

    revalidatePath(`/protected/organizations/${invite.org_id}`);

    return { success: true };
  } catch (error) {
    console.error("Error in resendOrganizationInvite:", error);
    return { success: false, error: "Failed to resend invite" };
  }
}
