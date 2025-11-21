"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Organization,
  OrganizationWithRole,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMember,
  OrganizationMemberWithProfile,
} from "@/lib/types/organization";
import type { UserProfile } from "@/lib/types/user";

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all organizations for the current user
 * Uses a workaround for RLS recursion by fetching separately
 */
export async function getUserOrganizations(): Promise<ActionResponse<OrganizationWithRole[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // First, get user's organization memberships
    const { data: memberships, error: memberError } = await supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("Error fetching memberships:", memberError);
      return { success: false, error: memberError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { success: true, data: [] };
    }

    // Get organization IDs
    const orgIds = memberships.map((m) => m.org_id);

    // Then fetch organizations
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("*")
      .in("id", orgIds)
      .order("created_at", { ascending: false });

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
      return { success: false, error: orgsError.message };
    }

    // Get member counts for each organization
    const { data: memberCounts, error: countError } = await supabase
      .from("organization_members")
      .select("org_id")
      .in("org_id", orgIds);

    if (countError) {
      console.error("Error fetching member counts:", countError);
      // Continue without counts rather than failing
    }

    // Count members per org
    const countMap = new Map<string, number>();
    if (memberCounts) {
      memberCounts.forEach((m) => {
        countMap.set(m.org_id, (countMap.get(m.org_id) || 0) + 1);
      });
    }

    // Combine data
    const organizations: OrganizationWithRole[] = orgs.map((org) => {
      const membership = memberships.find((m) => m.org_id === org.id);
      return {
        id: org.id,
        name: org.name,
        description: org.description,
        created_at: org.created_at,
        created_by: org.created_by,
        updated_at: org.updated_at,
        role: membership?.role || "member",
        member_count: countMap.get(org.id) || 0,
      };
    });

    return { success: true, data: organizations };
  } catch (error) {
    console.error("Error in getUserOrganizations:", error);
    return { success: false, error: "Failed to fetch organizations" };
  }
}

/**
 * Get a single organization by ID
 */
export async function getOrganization(organizationId: string): Promise<ActionResponse<OrganizationWithRole>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check membership first
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return { success: false, error: "Organization not found or access denied" };
    }

    // Fetch organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return { success: false, error: orgError.message };
    }

    // Get member count
    const { data: members, error: countError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", organizationId);

    const organization: OrganizationWithRole = {
      id: org.id,
      name: org.name,
      description: org.description,
      created_at: org.created_at,
      created_by: org.created_by,
      updated_at: org.updated_at,
      role: membership.role,
      member_count: members?.length || 0,
    };

    return { success: true, data: organization };
  } catch (error) {
    console.error("Error in getOrganization:", error);
    return { success: false, error: "Failed to fetch organization" };
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<ActionResponse<Organization>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return { success: false, error: "Not authenticated" };
    }

    console.log("Creating org for user:", user.id, "type:", typeof user.id);

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Organization name is required" };
    }

    // Ensure created_by is a proper UUID, not a string
    const insertData = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: user.id, // user.id should already be a UUID from Supabase
    };

    console.log("Insert data:", insertData);
    console.log("created_by type:", typeof insertData.created_by);

    const { data, error } = await supabase.from("organizations").insert(insertData).select().single();

    if (error) {
      console.error("Error creating organization:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message };
    }

    console.log("Organization created successfully:", data);

    // Manually insert the owner record if the trigger didn't work
    const { error: memberError } = await supabase.from("organization_members").insert({
      org_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      console.error("Error creating owner membership:", memberError);
      // Don't fail the whole operation if this fails
      // The trigger should have handled it
    }

    // Verify the membership was created
    const { data: membership, error: verifyError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("org_id", data.id)
      .eq("user_id", user.id)
      .single();

    if (verifyError) {
      console.error("Warning: Membership not found after creation:", verifyError);
    } else {
      console.log("Membership verified:", membership);
    }

    revalidatePath("/protected/organizations");

    return { success: true, data };
  } catch (error) {
    console.error("Error in createOrganization:", error);
    return { success: false, error: "Failed to create organization" };
  }
}

/**
 * Update an organization (owner only)
 */
export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<ActionResponse<Organization>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is owner
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "Organization not found" };
    }

    if (memberData.role !== "owner") {
      return { success: false, error: "Only owners can update organization details" };
    }

    // Prepare update object
    const updates: any = {};
    if (input.name !== undefined && input.name.trim().length > 0) {
      updates.name = input.name.trim();
    }
    if (input.description !== undefined) {
      updates.description = input.description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating organization:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/organizations");
    revalidatePath(`/protected/organizations/${organizationId}`);

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateOrganization:", error);
    return { success: false, error: "Failed to update organization" };
  }
}

/**
 * Delete an organization (owner only)
 */
export async function deleteOrganization(organizationId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is owner
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "Organization not found" };
    }

    if (memberData.role !== "owner") {
      return { success: false, error: "Only owners can delete organizations" };
    }

    const { error } = await supabase.from("organizations").delete().eq("id", organizationId);

    if (error) {
      console.error("Error deleting organization:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/organizations");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteOrganization:", error);
    return { success: false, error: "Failed to delete organization" };
  }
}

/**
 * Get members of an organization with their profiles (using view)
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<ActionResponse<OrganizationMemberWithProfile[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is a member of the organization
    const { data: memberCheck } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!memberCheck) {
      return { success: false, error: "Access denied" };
    }

    // Use the view for joined data
    const { data, error } = await supabase
      .from("organization_members_with_profiles")
      .select("*")
      .eq("org_id", organizationId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching organization members:", error);
      return { success: false, error: error.message };
    }

    // Transform data to match OrganizationMemberWithProfile type
    const membersWithProfiles: OrganizationMemberWithProfile[] = data.map((row: any) => ({
      id: row.id,
      org_id: row.org_id,
      user_id: row.user_id,
      role: row.role,
      joined_at: row.joined_at,
      profile: {
        id: row.user_id,
        email: row.email,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        created_at: row.profile_created_at,
        updated_at: row.profile_updated_at,
      },
    }));

    return { success: true, data: membersWithProfiles };
  } catch (error) {
    console.error("Error in getOrganizationMembers:", error);
    return { success: false, error: "Failed to fetch organization members" };
  }
}
