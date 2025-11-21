"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Board, CreateBoardInput, UpdateBoardInput } from "@/lib/types/organization";

/**
 * Get all boards for an organization
 */
export async function getOrganizationBoards(orgId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is a member of the organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  const { data: boards, error } = await supabase
    .from("boards")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: boards as Board[] };
}

/**
 * Get a single board by ID
 */
export async function getBoard(boardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: board, error } = await supabase.from("boards").select("*").eq("id", boardId).single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Check if user is a member of the organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  return { success: true, data: board as Board, role: membership.role };
}

/**
 * Create a new board
 */
export async function createBoard(input: CreateBoardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is a member of the organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", input.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      org_id: input.org_id,
      name: input.name,
      description: input.description || null,
      background_color: input.background_color || "#0079BF",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/protected/organizations/${input.org_id}`);
  revalidatePath(`/org/${input.org_id}`);

  return { success: true, data: board as Board };
}

/**
 * Update a board
 */
export async function updateBoard(boardId: string, input: UpdateBoardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get board to check org_id
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", boardId).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const { data: updatedBoard, error } = await supabase
    .from("boards")
    .update({
      name: input.name,
      description: input.description,
      background_color: input.background_color,
    })
    .eq("id", boardId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/protected/organizations/${board.org_id}`);
  revalidatePath(`/org/${board.org_id}/board/${boardId}`);

  return { success: true, data: updatedBoard as Board };
}

/**
 * Delete a board
 */
export async function deleteBoard(boardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get board to check org_id
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", boardId).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/protected/organizations/${board.org_id}`);
  revalidatePath(`/org/${board.org_id}`);

  return { success: true };
}
