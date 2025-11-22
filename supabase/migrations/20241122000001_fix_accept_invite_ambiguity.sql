-- Fix ambiguous column reference in accept_organization_invite function
CREATE OR REPLACE FUNCTION public.accept_organization_invite(
    invite_token TEXT,
    user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    user_email TEXT;
    result JSONB;
    p_user_id UUID := user_id; -- Create alias to avoid ambiguity
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
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

    -- Check if user is already a member (using alias to avoid ambiguity)
    IF EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE org_id = invite_record.org_id
        AND organization_members.user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You are already a member of this organization'
        );
    END IF;

    -- Accept invite: add user to organization
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (invite_record.org_id, p_user_id, invite_record.role);

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
