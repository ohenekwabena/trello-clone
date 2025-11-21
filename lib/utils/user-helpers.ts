import type { UserProfile } from "@/lib/types/user";

/**
 * Helper function to get display name or fallback to email
 */
export function getDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return "Unknown User";
  return profile.display_name || profile.email.split("@")[0];
}

/**
 * Helper function to get initials from profile
 */
export function getInitials(profile: UserProfile | null | undefined): string {
  if (!profile) return "?";

  const name = profile.display_name || profile.email;
  const parts = name.split(/[\s@]+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate avatar color based on user ID or email
 */
export function getAvatarColor(profile: UserProfile | null | undefined): string {
  if (!profile) return "#6B7280"; // gray-500

  const colors = [
    "#EF4444", // red
    "#F59E0B", // amber
    "#10B981", // emerald
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // orange
  ];

  const str = profile.id || profile.email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
