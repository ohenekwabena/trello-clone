-- Create organization_invites table
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(org_id, email, status) -- Prevent duplicate pending invites for same email
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_status ON public.organization_invites(status);
CREATE INDEX IF NOT EXISTS idx_organization_invites_expires_at ON public.organization_invites(expires_at);

-- Enable Row Level Security
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_invites table

-- Members can view invites for their organizations
CREATE POLICY "Members can view invites for their organizations"
    ON public.organization_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
        )
        OR
        -- Users can view invites sent to their email
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        -- Anyone can view by token (for acceptance page)
        TRUE
    );

-- Owners and admins can create invites
CREATE POLICY "Owners and admins can create invites"
    ON public.organization_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

-- Users can update their own invite responses
CREATE POLICY "Users can update invite responses"
    ON public.organization_invites
    FOR UPDATE
    USING (
        -- User's email matches invite email
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR
        -- Owners and admins can cancel invites
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

-- Owners and admins can delete invites
CREATE POLICY "Owners and admins can delete invites"
    ON public.organization_invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

-- Function to automatically expire old invites
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void AS $$
BEGIN
    UPDATE public.organization_invites
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and accept invite
CREATE OR REPLACE FUNCTION public.accept_organization_invite(
    invite_token TEXT,
    user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    user_email TEXT;
    result JSONB;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Get invite and lock row
    SELECT * INTO invite_record
    FROM public.organization_invites
    WHERE token = invite_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invite not found'
        );
    END IF;

    -- Validate invite
    IF invite_record.email != user_email THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invite was sent to a different email address'
        );
    END IF;

    IF invite_record.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invite has already been ' || invite_record.status
        );
    END IF;

    IF invite_record.expires_at < NOW() THEN
        -- Mark as expired
        UPDATE public.organization_invites
        SET status = 'expired'
        WHERE id = invite_record.id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This invite has expired'
        );
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE org_id = invite_record.org_id
        AND user_id = user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You are already a member of this organization'
        );
    END IF;

    -- Accept invite: add user to organization
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (invite_record.org_id, user_id, invite_record.role);

    -- Update invite status
    UPDATE public.organization_invites
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = invite_record.id;

    RETURN jsonb_build_object(
        'success', true,
        'org_id', invite_record.org_id
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You are already a member of this organization'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'An error occurred: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to expire old invites (run daily)
-- Note: This requires pg_cron extension. If not available, run manually or via API
-- SELECT cron.schedule('expire-old-invites', '0 0 * * *', 'SELECT public.expire_old_invites()');

-- Add comment for documentation
COMMENT ON TABLE public.organization_invites IS 'Stores pending and completed organization member invitations';
COMMENT ON FUNCTION public.accept_organization_invite IS 'Validates and accepts an organization invite, adding the user as a member';
COMMENT ON FUNCTION public.expire_old_invites IS 'Marks pending invites past their expiration date as expired';
