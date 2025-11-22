import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInviteByToken } from "@/lib/actions/invites";
import { InviteAcceptanceClient } from "./invite-acceptance-client";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get invite details
  const result = await getInviteByToken(token);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Invite Not Found</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {result.error || "This invite link is invalid or has expired."}
          </p>
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <InviteAcceptanceClient inviteInfo={result.data} user={user} token={token} />;
}
