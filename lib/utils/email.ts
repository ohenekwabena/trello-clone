/**
 * Utility functions for sending invite emails
 */

import { Resend } from "resend";

interface SendInviteEmailParams {
  inviteId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  role: string;
  inviteToken: string;
}

interface SendInviteEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    inviteId: string;
    email: string;
    inviteUrl: string;
  };
}

/**
 * Generate HTML email template for organization invite
 */
function generateInviteEmailHTML({
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px; color: white;">✉️</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">You're Invited!</h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Join ${organizationName}</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                Click the button below to view your invitation. You'll need to sign in to accept or decline.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 12px; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                  ${inviteUrl}
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                ⏰ This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px;">
                This invitation was sent to you by ${organizationName}
              </p>
              <p style="margin: 0; color: #cccccc; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send an invite email via Resend
 */
export async function sendInviteEmail({
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
    console.log("🔄 Starting email send process via Resend for:", to);

    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      return { success: false, error: "Email service not configured" };
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate email HTML
    const htmlContent = generateInviteEmailHTML({
      organizationName,
      inviterName,
      role: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize role
      inviteUrl,
    });

    // Send email via Resend
    console.log("📧 Sending invite email via Resend...");
    const { data, error } = await resend.emails.send({
      from: "Like-Trello <hello@notifications.ohenekwabena.xyz>",
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Email sent successfully via Resend");
    console.log("📬 Email ID:", data?.id);
    console.log(`✅ Invite email delivered to ${to}`);

    return { success: true };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format role for display in emails
 */
export function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
