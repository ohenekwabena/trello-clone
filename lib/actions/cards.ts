"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Card,
  CardWithDetails,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  CardActivityWithActor,
} from "@/lib/types/organization";

/**
 * Get all cards for a list
 */
export async function getListCards(listId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: cards as Card[] };
}

/**
 * Get a single card with details
 */
export async function getCard(cardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: card, error } = await supabase
    .from("cards")
    .select(
      `
      *,
      assigned_user:assigned_to(id, email),
      created_user:created_by(id, email)
    `
    )
    .eq("id", cardId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: card as any as CardWithDetails };
}

/**
 * Create a new card
 */
export async function createCard(input: CreateCardInput) {
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

  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      board_id: input.board_id,
      list_id: input.list_id,
      title: input.title,
      description: input.description || null,
      position: input.position,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/org/${board.org_id}/board/${input.board_id}`);

  return { success: true, data: card as Card };
}

/**
 * Update a card
 */
export async function updateCard(cardId: string, input: UpdateCardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get card to check board access
  const { data: card } = await supabase.from("cards").select("board_id").eq("id", cardId).single();

  if (!card) {
    return { success: false, error: "Card not found" };
  }

  // Check if user has access to this board
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", card.board_id).single();

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

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.list_id !== undefined) updateData.list_id = input.list_id;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.due_date !== undefined) updateData.due_date = input.due_date;
  if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;

  const { data: updatedCard, error } = await supabase
    .from("cards")
    .update(updateData)
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/org/${board.org_id}/board/${card.board_id}`);

  return { success: true, data: updatedCard as Card };
}

/**
 * Move a card to a different list and/or position
 */
export async function moveCard(input: MoveCardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: card } = await supabase.from("cards").select("board_id, list_id").eq("id", input.card_id).single();

  if (!card) {
    return { success: false, error: "Card not found" };
  }

  // Get board to get org_id for revalidation
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", card.board_id).single();

  const { data: updatedCard, error } = await supabase
    .from("cards")
    .update({
      list_id: input.target_list_id,
      position: input.target_position,
    })
    .eq("id", input.card_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (board) {
    revalidatePath(`/org/${board.org_id}/board/${card.board_id}`);
  }

  return { success: true, data: updatedCard as Card };
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get card to check board access
  const { data: card } = await supabase.from("cards").select("board_id").eq("id", cardId).single();

  if (!card) {
    return { success: false, error: "Card not found" };
  }

  // Get board to get org_id for revalidation
  const { data: board } = await supabase.from("boards").select("org_id").eq("id", card.board_id).single();

  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (board) {
    revalidatePath(`/org/${board.org_id}/board/${card.board_id}`);
  }

  return { success: true };
}

/**
 * Get next position for a new card in a list
 */
export async function getNextCardPosition(listId: string) {
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1);

  if (!cards || cards.length === 0) {
    return 1000; // First card
  }

  return cards[0].position + 1000;
}

/**
 * Get card activities (history)
 */
export async function getCardActivities(cardId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("card_activities")
    .select(
      `
      *,
      actor_profile:user_profiles!card_activities_actor_id_fkey(id, email, display_name, avatar_url)
    `
    )
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching card activities:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get all cards for a board (for initial load)
 */
export async function getBoardCards(boardId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      *,
      list:lists(id, title),
      assigned_to_profile:user_profiles!cards_assigned_to_fkey(id, email, display_name, avatar_url),
      created_by_profile:user_profiles!cards_created_by_fkey(id, email, display_name, avatar_url)
    `
    )
    .eq("board_id", boardId)
    .order("position");

  if (error) {
    console.error("Error fetching cards:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
