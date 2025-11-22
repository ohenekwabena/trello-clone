import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/protected";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type"); // Check for recovery type

  // Handle error cases
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    // Check if this is an invite flow by checking user metadata
    const user = data.user;
    if (user?.user_metadata) {
      const metadata = user.user_metadata;

      // If the user was invited, check for organization/role info in metadata
      if (metadata.organization_name || metadata.role) {
        console.log("✅ Invite signup detected for:", user.email);
        console.log("Organization:", metadata.organization_name);
        console.log("Role:", metadata.role);

        // Look for the invite token in the database
        const { data: inviteData, error: inviteError } = await supabase
          .from("organization_invites")
          .select("token")
          .eq("email", user.email?.toLowerCase())
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!inviteError && inviteData?.token) {
          console.log("🔗 Found invite token, redirecting to invite acceptance page");
          return NextResponse.redirect(new URL(`/invite/${inviteData.token}`, requestUrl.origin));
        } else {
          console.log("⚠️ No pending invite found for user, redirecting to organizations");
        }
      }

      // Check if user needs to set password (email-based invite)
      if (metadata.needs_password_setup === true) {
        console.log("🔑 User needs to set password, redirecting to set-password");

        // Try to find invite token for redirect after password setup
        const { data: inviteData } = await supabase
          .from("organization_invites")
          .select("token")
          .eq("email", user.email?.toLowerCase())
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const inviteParam = inviteData?.token ? `?invite=${inviteData.token}` : "";
        return NextResponse.redirect(new URL(`/auth/set-password${inviteParam}`, requestUrl.origin));
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // If no code, redirect to login
  console.warn("No code in callback URL, redirecting to login");
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
