"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { List, CreateListInput, UpdateListInput } from "@/lib/types/organization";

/**
 * Get all lists for a board
 */
export async function getBoardLists(boardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has access to this board
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", boardId).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  const { data: lists, error } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: lists as List[] };
}

/**
 * Create a new list
 */
export async function createList(input: CreateListInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user has access to this board
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", input.board_id).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      board_id: input.board_id,
      title: input.title,
      position: input.position,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/org/[orgId]/board/${input.board_id}`);

  return { success: true, data: list as List };
}

/**
 * Update a list
 */
export async function updateList(listId: string, input: UpdateListInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get list to check board access
  const { data: list } = await supabase.from("lists").select("board_id").eq("id", listId).single();

  if (!list) {
    return { success: false, error: "List not found" };
  }

  // Check if user has access to this board
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", list.board_id).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this organization" };
  }

  const { data: updatedList, error } = await supabase
    .from("lists")
    .update({
      title: input.title,
      position: input.position,
    })
    .eq("id", listId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/org/[orgId]/board/${list.board_id}`);

  return { success: true, data: updatedList as List };
}

/**
 * Delete a list
 */
export async function deleteList(listId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get list to check board access
  const { data: list } = await supabase.from("lists").select("board_id").eq("id", listId).single();

  if (!list) {
    return { success: false, error: "List not found" };
  }

  // Check if user is owner or admin
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", list.board_id).single();

  if (!board) {
    return { success: false, error: "Board not found" };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", board.org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/org/[orgId]/board/${list.board_id}`);

  return { success: true };
}

/**
 * Get next position for a new list
 */
export async function getNextListPosition(boardId: string) {
  const supabase = await createClient();

  const { data: lists } = await supabase
    .from("lists")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1);

  if (!lists || lists.length === 0) {
    return 1000; // First list
  }

  return lists[0].position + 1000;
}
