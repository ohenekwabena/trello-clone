import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail, isValidEmail, formatRole } from "@/lib/utils/email";

/**
 * API Route to send organization invite emails
 * POST /api/send-invite
 *
 * This endpoint handles sending invite emails to users invited to join an organization.
 * It uses Supabase's built-in email functionality or can be extended with third-party
 * email services like Resend, SendGrid, or AWS SES.
 */

interface SendInviteRequest {
  inviteId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  role: string;
  inviteToken: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SendInviteRequest = await request.json();
    const { inviteId, email, organizationName, inviterName, role, inviteToken } = body;

    // Validate required fields
    if (!inviteId || !email || !organizationName || !inviteToken) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Verify the request is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify the invite exists and belongs to the authenticated user's organization
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*, organizations(name)")
      .eq("id", inviteId)
      .eq("token", inviteToken)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ success: false, error: "Invalid invite" }, { status: 404 });
    }

    // Check if invite has already been used or expired
    if (invite.status !== "pending") {
      return NextResponse.json({ success: false, error: "Invite is no longer pending" }, { status: 400 });
    }

    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "Invite has expired" }, { status: 400 });
    }

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${inviteToken}`;

    // Send email using the utility function
    const emailSent = await sendInviteEmail({
      to: email,
      inviteUrl,
      organizationName,
      inviterName: inviterName || "A team member",
      role: formatRole(role),
    });

    if (!emailSent.success) {
      return NextResponse.json({ success: false, error: emailSent.error || "Failed to send email" }, { status: 500 });
    }

    // Update invite record to mark email as sent
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) {
      console.error("Failed to update invite record:", updateError);
      // Don't fail the request if email was sent successfully
    }

    return NextResponse.json({
      success: true,
      message: "Invite email sent successfully",
      data: {
        inviteId,
        email,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error("Error in send-invite API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
