"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UpdateUserProfileInput } from "@/lib/types/user";

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }

  return { success: true, data: data as UserProfile };
}

/**
 * Get a user profile by ID
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }

  return { success: true, data: data as UserProfile };
}

/**
 * Get multiple user profiles by IDs
 */
export async function getUserProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return { success: true, data: [] };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.from("user_profiles").select("*").in("id", userIds);

  if (error) {
    console.error("Error fetching user profiles:", error);
    return { success: false, error: "Failed to fetch profiles" };
  }

  return { success: true, data: data as UserProfile[] };
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(input: UpdateUserProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      display_name: input.display_name,
      avatar_url: input.avatar_url,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }

  return { success: true, data: data as UserProfile };
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("user_profiles").select("*").eq("email", email).single();

  if (error) {
    console.error("Error fetching user profile by email:", error);
    return { success: false, error: "User not found" };
  }

  return { success: true, data: data as UserProfile };
}
