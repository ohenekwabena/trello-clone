-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster board queries
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(board_id, position);

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lists

-- Users can view lists if they are members of the organization that owns the board
CREATE POLICY "Users can view lists in their organization boards"
  ON lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = lists.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can create lists
CREATE POLICY "Organization members can create lists"
  ON lists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = lists.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can update lists
CREATE POLICY "Organization members can update lists"
  ON lists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = lists.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization owners and admins can delete lists
CREATE POLICY "Organization owners and admins can delete lists"
  ON lists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = lists.board_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER lists_updated_at_trigger
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_lists_updated_at();
