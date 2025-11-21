-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  background_color TEXT DEFAULT '#0079BF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster org queries
CREATE INDEX IF NOT EXISTS idx_boards_org_id ON boards(org_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON boards(created_by);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards

-- 1. Users can view boards if they are members of the organization
CREATE POLICY "Users can view boards in their organizations"
  ON boards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = boards.org_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 2. Organization members can create boards
CREATE POLICY "Organization members can create boards"
  ON boards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = boards.org_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- 3. Organization owners and admins can update boards
CREATE POLICY "Organization owners and admins can update boards"
  ON boards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = boards.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- 4. Organization owners and admins can delete boards
CREATE POLICY "Organization owners and admins can delete boards"
  ON boards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = boards.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER boards_updated_at_trigger
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_boards_updated_at();
