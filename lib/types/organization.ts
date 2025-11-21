export type OrganizationRole = "owner" | "admin" | "member";

import type { UserProfile } from "./user";

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrganizationRole;
  joined_at: string;
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile: UserProfile;
}

export interface OrganizationWithRole extends Organization {
  role: OrganizationRole;
  member_count?: number;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
}

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";
export type InviteRole = "admin" | "member";

export interface OrganizationInvite {
  id: string;
  org_id: string;
  email: string;
  token: string;
  role: InviteRole;
  status: InviteStatus;
  expires_at: string;
  invited_by: string;
  created_at: string;
  responded_at: string | null;
}

export interface OrganizationInviteWithDetails extends OrganizationInvite {
  organization?: Organization;
  inviter_profile?: UserProfile;
}

export interface CreateInviteInput {
  org_id: string;
  email: string;
  role: InviteRole;
}

export interface InviteInfo {
  invite: OrganizationInvite;
  organization: Organization;
  inviter_profile: UserProfile;
}

// Board types
export interface Board {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  background_color: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface CreateBoardInput {
  org_id: string;
  name: string;
  description?: string;
  background_color?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  background_color?: string;
}

// List types
export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateListInput {
  board_id: string;
  title: string;
  position: number;
}

export interface UpdateListInput {
  title?: string;
  position?: number;
}

// Card types
export interface Card {
  id: string;
  board_id: string;
  list_id: string;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CardWithDetails extends Card {
  assigned_profile?: UserProfile;
  created_profile?: UserProfile;
}

export interface CreateCardInput {
  board_id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  list_id?: string;
  position?: number;
  due_date?: string | null;
  assigned_to?: string | null;
}

export interface MoveCardInput {
  card_id: string;
  target_list_id: string;
  target_position: number;
}

// Card Activity types
export type CardActivityType =
  | "card_created"
  | "card_updated"
  | "card_moved"
  | "card_assigned"
  | "card_unassigned"
  | "card_due_date_set"
  | "card_due_date_changed"
  | "card_due_date_removed"
  | "comment_added";

export interface CardActivity {
  id: string;
  card_id: string;
  board_id: string;
  actor_id: string;
  activity_type: CardActivityType;
  payload: Record<string, any>;
  created_at: string;
}

export interface CardActivityWithActor extends CardActivity {
  actor_profile: UserProfile;
}

// Board with lists and cards
export interface BoardWithLists extends Board {
  lists: ListWithCards[];
}

export interface ListWithCards extends List {
  cards: Card[];
}
