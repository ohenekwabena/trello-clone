# Organization Invitation System - Complete Guide

## 🎯 Overview

A complete invitation system for organizations that allows admins and owners to invite new members via email with secure, time-limited tokens.

## ✨ Features Implemented

### Core Features
- ✅ Email-based invitations with unique tokens
- ✅ 7-day expiration for invite links
- ✅ Role assignment (admin or member) during invitation
- ✅ Accept/Decline invitation workflow
- ✅ Pending invites management
- ✅ Resend and cancel invite functionality
- ✅ Automatic expiration of old invites
- ✅ Duplicate invite prevention

### Security Features
- ✅ Secure token generation (32 bytes)
- ✅ Email validation on acceptance
- ✅ Row Level Security (RLS) policies
- ✅ Permission checks for all operations
- ✅ Duplicate member prevention
- ✅ Expired invite handling

## 📊 Database Schema

### `organization_invites` Table

```sql
- id (UUID, Primary Key)
- org_id (UUID, Foreign Key to organizations)
- email (TEXT, NOT NULL)
- token (TEXT, UNIQUE, NOT NULL)
- role (TEXT: 'admin' | 'member')
- status (TEXT: 'pending' | 'accepted' | 'declined' | 'expired')
- expires_at (TIMESTAMPTZ, NOT NULL)
- invited_by (UUID, Foreign Key to auth.users)
- created_at (TIMESTAMPTZ, NOT NULL)
- responded_at (TIMESTAMPTZ)
- UNIQUE(org_id, email, status) -- Prevents duplicate pending invites
```

### Database Functions

#### `accept_organization_invite(invite_token, user_id)`
- Validates invite token and user email match
- Checks invite status and expiration
- Prevents duplicate memberships
- Adds user to organization_members
- Updates invite status to 'accepted'
- Returns success/error response

#### `expire_old_invites()`
- Marks pending invites past expiration as 'expired'
- Should be run periodically (daily recommended)

## 🚀 Quick Setup

### 1. Apply Database Migration

Run in Supabase SQL Editor:

```sql
-- Option 1: Run complete setup (includes organizations + invites)
-- Copy content from: supabase/COMPLETE_SETUP.sql

-- Option 2: Run invites migration only (if organizations already exist)
-- Copy content from: supabase/migrations/20231121000001_create_invites.sql
```

### 2. Test the System

```bash
# Start development server
npm run dev

# Navigate to an organization page
http://localhost:3000/protected/organizations/[org-id]

# Click "Invite Members" button
# Enter email and select role
# Check console for invite link
```

## 📝 Usage Guide

### For Organization Admins/Owners

#### 1. Send an Invitation

```typescript
// Via UI: Click "Invite Members" button
// Or programmatically:
import { createOrganizationInvite } from '@/lib/actions/invites';

const result = await createOrganizationInvite({
  org_id: 'organization-uuid',
  email: 'user@example.com',
  role: 'member' // or 'admin'
});

if (result.success) {
  console.log('Invite sent!');
  console.log('Token:', result.data.token);
}
```

#### 2. View Pending Invites

- Navigate to organization detail page
- View "Pending Invites" section
- See status, role, and expiration for each invite

#### 3. Manage Invites

**Resend Invite:**
- Click "Resend" button on pending invite
- Generates new token and extends expiration by 7 days
- New link logged to console

**Cancel Invite:**
- Click "Cancel" button on pending invite
- Removes invite from system
- Invited user can no longer accept

### For Invited Users

#### 1. Receive Invitation

You'll receive an invite link (currently logged to console):
```
http://localhost:3000/invite/[token]
```

#### 2. Accept Invitation

1. Click invite link
2. Sign in (or create account if needed)
3. Verify organization details
4. Click "Accept Invitation"
5. Redirected to organization page

#### 3. Decline Invitation

1. Click invite link
2. Sign in
3. Click "Decline"
4. Redirected to organizations list

## 🔐 Security & Permissions

### Who Can Invite?

- **Owners**: ✅ Can invite members with any role
- **Admins**: ✅ Can invite members with any role
- **Members**: ❌ Cannot invite

### Invite Validation

✅ **On Creation:**
- Email format validation
- Duplicate invite check
- Existing member check
- Permission verification

✅ **On Acceptance:**
- Token validation
- Email match verification
- Expiration check
- Status validation
- Duplicate membership prevention

## 📧 Email Integration

### Current Implementation (Development)

Invite links are logged to the console:

```javascript
console.log('📧 Invite created for:', email);
console.log('🔗 Invite link:', inviteLink);
console.log('⏰ Expires:', expiresAt);
```

### Production Implementation

To add email sending:

1. **Choose Email Service:**
   - Resend (recommended)
   - SendGrid
   - AWS SES
   - Postmark

2. **Update Server Action:**

```typescript
// lib/actions/invites.ts

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// In createOrganizationInvite function:
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: input.email,
  subject: `You're invited to join ${orgName}`,
  html: `
    <h1>You're invited!</h1>
    <p>Click the link below to join ${orgName}:</p>
    <a href="${inviteLink}">Accept Invitation</a>
    <p>This link expires in 7 days.</p>
  `
});
```

3. **Environment Variables:**

```env
# .env.local
RESEND_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🎨 UI Components

### 1. InviteMembersModal

**Location:** `components/organizations/invite-members-modal.tsx`

**Features:**
- Email input with validation
- Role selection (admin/member)
- Loading states
- Success/error feedback
- Info about expiration

**Usage:**
```tsx
<InviteMembersModal
  organizationId={org.id}
  organizationName={org.name}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={() => console.log('Invite sent!')}
/>
```

### 2. PendingInvitesList

**Location:** `components/organizations/pending-invites-list.tsx`

**Features:**
- Lists all invites (pending, accepted, declined, expired)
- Status badges with icons
- Resend functionality
- Cancel functionality
- Expiration warnings
- Empty state

**Usage:**
```tsx
<PendingInvitesList organizationId={org.id} />
```

### 3. InviteAcceptanceClient

**Location:** `app/invite/[token]/invite-acceptance-client.tsx`

**Features:**
- Organization details display
- Inviter information
- Email validation warning
- Accept/Decline buttons
- Expired invite handling
- Already responded handling
- Sign-in redirect for anonymous users

## 🔄 Invite Lifecycle

```
1. Creation
   ├─ Admin/Owner creates invite
   ├─ Unique token generated
   ├─ Expiration set (7 days)
   └─ Status: 'pending'

2. Pending
   ├─ Can be resent (new token, new expiration)
   ├─ Can be canceled
   └─ Auto-expires after 7 days

3. Response
   ├─ Accept
   │  ├─ User added to organization_members
   │  ├─ Status: 'accepted'
   │  └─ responded_at timestamp set
   │
   ├─ Decline
   │  ├─ Status: 'declined'
   │  └─ responded_at timestamp set
   │
   └─ Expire
      └─ Status: 'expired'
```

## 🛠️ Server Actions

### `createOrganizationInvite(input)`

Creates a new organization invite.

**Parameters:**
```typescript
{
  org_id: string;
  email: string;
  role: 'admin' | 'member';
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: OrganizationInvite;
  error?: string;
}
```

### `getOrganizationInvites(organizationId)`

Gets all invites for an organization.

**Returns:** Array of invites with all statuses.

### `getInviteByToken(token)`

Gets invite details by token for acceptance page.

**Returns:** Invite with organization and inviter details.

### `acceptOrganizationInvite(token)`

Accepts an invite and adds user to organization.

**Returns:** Success status and org_id.

### `declineOrganizationInvite(token)`

Declines an invite.

**Returns:** Success status.

### `cancelOrganizationInvite(inviteId)`

Cancels a pending invite (admin/owner only).

**Returns:** Success status.

### `resendOrganizationInvite(inviteId)`

Resends an invite with new token and expiration.

**Returns:** Success status.

## 🧪 Testing Checklist

- [ ] Create invite as owner
- [ ] Create invite as admin
- [ ] Try creating invite as member (should fail)
- [ ] Accept invite with matching email
- [ ] Try accepting invite with different email (should fail)
- [ ] Decline invite
- [ ] Try accepting expired invite
- [ ] Try accepting already-accepted invite
- [ ] Resend invite and verify new token works
- [ ] Cancel invite and verify link no longer works
- [ ] Try creating duplicate invite (should fail)
- [ ] Try inviting existing member (should fail)
- [ ] Verify RLS policies (users can only see relevant invites)

## 🐛 Troubleshooting

### Invite Not Found
- Check token is correct
- Verify invite exists in database
- Check if invite was canceled

### Cannot Accept Invite
- Verify signed-in email matches invited email
- Check invite hasn't expired
- Confirm invite status is 'pending'
- Verify not already a member

### Cannot Create Invite
- Confirm you're owner or admin
- Check email format is valid
- Verify no pending invite exists for that email
- Check user isn't already a member

### Database Function Errors
- Ensure migrations were applied correctly
- Check Supabase logs for detailed errors
- Verify RLS policies are enabled

## 📈 Future Enhancements

- [ ] Email templates with company branding
- [ ] Bulk invite functionality
- [ ] Custom expiration periods
- [ ] Invite analytics (open rate, acceptance rate)
- [ ] Automatic reminder emails
- [ ] Custom roles beyond admin/member
- [ ] Invite quotas and rate limiting
- [ ] Revoke accepted invites (remove member)
- [ ] Invite history and audit logs

## 🎉 Complete Feature Set

### ✅ Database Layer
- Invites table with RLS
- Accept invite function
- Expire invites function
- Proper indexes for performance

### ✅ Server Actions
- Create invite with validation
- List invites for organization
- Get invite by token
- Accept invite with checks
- Decline invite
- Cancel invite (admin/owner)
- Resend invite with new token

### ✅ UI Components
- Invite modal with form
- Pending invites list
- Invite acceptance page
- Status badges and icons
- Loading and error states

### ✅ Integration
- Organization detail page
- Navigation and routing
- Permission checks
- Cache revalidation

---

**Status: ✅ FULLY IMPLEMENTED AND READY TO USE**

Apply the database migration and start inviting members to your organizations! 🚀
