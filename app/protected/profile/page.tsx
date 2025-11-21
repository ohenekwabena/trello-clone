import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/actions/user-profile";
import { ProfileSettingsClient } from "./profile-settings-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const result = await getCurrentUserProfile();

  if (!result.success || !result.data) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {result.error || "Failed to load profile"}
        </div>
      </div>
    );
  }

  return <ProfileSettingsClient profile={result.data} />;
}
