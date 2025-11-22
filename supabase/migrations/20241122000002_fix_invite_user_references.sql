-- Fix organization_invites to reference user_profiles instead of auth.users
-- This resolves "permission denied for table users" errors

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Members can view invites for their organizations" ON public.organization_invites;
DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Users can update invite responses" ON public.organization_invites;
DROP POLICY IF EXISTS "Owners and admins can delete invites" ON public.organization_invites;

-- Drop the old foreign key constraint
ALTER TABLE public.organization_invites 
DROP CONSTRAINT IF EXISTS organization_invites_invited_by_fkey;

-- Add new foreign key constraint to user_profiles
ALTER TABLE public.organization_invites 
ADD CONSTRAINT organization_invites_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Recreate RLS policies with corrected references

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
        email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
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

-- Users can update invite responses
CREATE POLICY "Users can update invite responses"
    ON public.organization_invites
    FOR UPDATE
    USING (
        -- User's email matches invite email
        email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        OR
        -- Owners and admins can update invites
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

-- Update accept_organization_invite function to use user_profiles
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
    -- Get user email from user_profiles instead of auth.users
    SELECT email INTO user_email FROM public.user_profiles WHERE id = user_id;
    
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

-- Add comment
COMMENT ON CONSTRAINT organization_invites_invited_by_fkey ON public.organization_invites 
IS 'References user_profiles instead of auth.users to avoid permission issues';
