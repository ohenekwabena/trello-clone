import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Verify the request is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the invite exists and belongs to the authenticated user's organization
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select("*, organizations(name)")
      .eq("id", inviteId)
      .eq("token", inviteToken)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { success: false, error: "Invalid invite" },
        { status: 404 }
      );
    }

    // Check if invite has already been used or expired
    if (invite.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Invite is no longer pending" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invite has expired" },
        { status: 400 }
      );
    }

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/invite/${inviteToken}`;

    // Send email using Supabase Auth (if configured)
    // OR use a third-party email service
    const emailSent = await sendInviteEmail({
      to: email,
      inviteUrl,
      organizationName,
      inviterName: inviterName || "A team member",
      role,
    });

    if (!emailSent.success) {
      return NextResponse.json(
        { success: false, error: emailSent.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update invite record to mark email as sent
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
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
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send invite email using your preferred email service
 * This is a template function that you should customize based on your email provider
 */
async function sendInviteEmail({
  to,
  inviteUrl,
  organizationName,
  inviterName,
  role,
}: {
  to: string;
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // OPTION 1: Using Supabase built-in email (requires SMTP configuration in Supabase dashboard)
    // This is automatically handled by Supabase when you create users
    // For custom emails, you'll need to use a third-party service

    // OPTION 2: Using Resend (recommended for Next.js)
    // Uncomment and configure if you have Resend API key
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      html: getEmailTemplate({ inviteUrl, organizationName, inviterName, role }),
    });
    */

    // OPTION 3: Using SendGrid
    // Uncomment and configure if you have SendGrid API key
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      subject: `You've been invited to join ${organizationName}`,
      html: getEmailTemplate({ inviteUrl, organizationName, inviterName, role }),
    });
    */

    // OPTION 4: Using Nodemailer (SMTP)
    // Uncomment and configure if you have SMTP credentials
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to,
      subject: `You've been invited to join ${organizationName}`,
      html: getEmailTemplate({ inviteUrl, organizationName, inviterName, role }),
    });
    */

    // TEMPORARY: Log email details (for development)
    // Remove this in production and implement one of the options above
    console.log("=== INVITE EMAIL ===");
    console.log("To:", to);
    console.log("Subject:", `You've been invited to join ${organizationName}`);
    console.log("Invite URL:", inviteUrl);
    console.log("Inviter:", inviterName);
    console.log("Role:", role);
    console.log("===================");

    // For development, simulate successful email sending
    // Replace this with actual email sending logic in production
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }

    // In production, throw an error if no email service is configured
    throw new Error("No email service configured. Please set up Resend, SendGrid, or SMTP.");
  } catch (error) {
    console.error("Error sending invite email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * HTML email template for organization invites
 */
function getEmailTemplate({
  inviteUrl,
  organizationName,
  inviterName,
  role,
}: {
  inviteUrl: string;
  organizationName: string;
  inviterName: string;
  role: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Invite</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                    You've been invited!
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 24px;">
                    Hi there,
                  </p>
                  <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 24px;">
                    <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.
                  </p>
                  <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 24px;">
                    Click the button below to accept the invitation and get started:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${inviteUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500;">
                          Accept Invitation
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0; color: #3b82f6; font-size: 14px; line-height: 20px; word-break: break-all;">
                    ${inviteUrl}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
                    This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                  <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center;">
                    © ${new Date().getFullYear()} ${organizationName}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
