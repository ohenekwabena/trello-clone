export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileInput {
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface OrganizationMemberWithProfile {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile: UserProfile;
}
