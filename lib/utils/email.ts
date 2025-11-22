/**
 * Utility functions for sending invite emails
 */

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
 * Send an invite email via the API route
 * This function can be called from client or server components
 */
export async function sendInviteEmail(
  params: SendInviteEmailParams
): Promise<SendInviteEmailResponse> {
  try {
    const response = await fetch("/api/send-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("Error calling send-invite API:", error);
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
