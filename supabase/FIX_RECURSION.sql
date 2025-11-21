-- ============================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================
-- This script fixes the infinite recursion error by:
-- 1. Dropping problematic policies
-- 2. Creating SECURITY DEFINER functions that bypass RLS
-- 3. Recreating policies using these functions
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Drop ALL existing policies (get all policy names dynamically)
-- ============================================================

-- Drop all policies on organization_members
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_members', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on organizations
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: Create SECURITY DEFINER functions (bypass RLS)
-- ============================================================

-- Function to check if user is member of org
CREATE OR REPLACE FUNCTION public.is_org_member(org_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = org_uuid AND user_id = user_uuid
  ) INTO is_member;
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in org
CREATE OR REPLACE FUNCTION public.get_user_org_role(org_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE org_id = org_uuid AND user_id = user_uuid;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids(user_uuid UUID)
RETURNS TABLE(org_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.org_id
  FROM public.organization_members om
  WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Recreate policies using SECURITY DEFINER functions
-- ============================================================

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations FOR SELECT
    USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update organizations"
    ON public.organizations FOR UPDATE
    USING (public.get_user_org_role(id, auth.uid()) = 'owner');

CREATE POLICY "Owners can delete organizations"
    ON public.organizations FOR DELETE
    USING (public.get_user_org_role(id, auth.uid()) = 'owner');

-- Organization members policies
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "System and admins can add members"
    ON public.organization_members FOR INSERT
    WITH CHECK (
        -- Allow if user is owner/admin of the org
        public.get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
        -- OR if this is the user adding themselves as owner (initial creation via trigger)
        OR (
            role = 'owner' 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can update member roles"
    ON public.organization_members FOR UPDATE
    USING (public.get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can remove members"
    ON public.organization_members FOR DELETE
    USING (
        public.get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
        OR user_id = auth.uid() -- Users can remove themselves
    );

-- ============================================================
-- STEP 4: Ensure trigger exists for automatic owner assignment
-- ============================================================

-- Trigger function to add creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;

CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Restart your Next.js dev server';
    RAISE NOTICE '2. Navigate to /protected/organizations';
    RAISE NOTICE '3. The infinite recursion error should be fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with: SELECT * FROM organizations;';
END $$;
