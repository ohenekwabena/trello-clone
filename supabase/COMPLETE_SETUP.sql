-- ============================================================
-- COMPLETE DATABASE SETUP FOR ORGANIZATION MANAGEMENT
-- Including Organizations + Invitations System
-- ============================================================
-- Run this entire script in your Supabase SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: ORGANIZATIONS & MEMBERS
-- ============================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization_members junction table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- Create indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update organizations"
    ON public.organizations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'owner'
        )
    );

CREATE POLICY "Owners can delete organizations"
    ON public.organizations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'owner'
        )
    );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can add members"
    ON public.organization_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can update members"
    ON public.organization_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can remove members"
    ON public.organization_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Triggers for organizations
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_organization_updated ON public.organizations;
CREATE TRIGGER on_organization_updated
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 2: ORGANIZATION INVITES
-- ============================================================

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
    UNIQUE(org_id, email, status)
);

-- Create indexes for invites
CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_status ON public.organization_invites(status);
CREATE INDEX IF NOT EXISTS idx_organization_invites_expires_at ON public.organization_invites(expires_at);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invites
CREATE POLICY "Members can view invites for their organizations"
    ON public.organization_invites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
        )
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR TRUE
    );

CREATE POLICY "Owners and admins can create invites"
    ON public.organization_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can update invite responses"
    ON public.organization_invites FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can delete invites"
    ON public.organization_invites FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = organization_invites.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_organization_invite(
    invite_token TEXT,
    user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    SELECT * INTO invite_record FROM public.organization_invites
    WHERE token = invite_token FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invite not found');
    END IF;

    IF invite_record.email != user_email THEN
        RETURN jsonb_build_object('success', false, 'error', 'This invite was sent to a different email address');
    END IF;

    IF invite_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This invite has already been ' || invite_record.status);
    END IF;

    IF invite_record.expires_at < NOW() THEN
        UPDATE public.organization_invites SET status = 'expired' WHERE id = invite_record.id;
        RETURN jsonb_build_object('success', false, 'error', 'This invite has expired');
    END IF;

    IF EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = invite_record.org_id AND user_id = user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
    END IF;

    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (invite_record.org_id, user_id, invite_record.role);

    UPDATE public.organization_invites
    SET status = 'accepted', responded_at = NOW()
    WHERE id = invite_record.id;

    RETURN jsonb_build_object('success', true, 'org_id', invite_record.org_id);
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'An error occurred: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invites
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void AS $$
BEGIN
    UPDATE public.organization_invites
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- ✅ Organizations table created
-- ✅ Organization members table created
-- ✅ Organization invites table created
-- ✅ All RLS policies applied
-- ✅ All triggers and functions created
--
-- You can now:
-- 1. Navigate to /protected/organizations
-- 2. Create organizations
-- 3. Invite members
-- 4. Accept invitations at /invite/[token]
-- ============================================================
