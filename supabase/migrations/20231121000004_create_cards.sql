-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(list_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_assigned_to ON cards(assigned_to);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards

-- Users can view cards if they are members of the organization that owns the board
CREATE POLICY "Users can view cards in their organization boards"
  ON cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = cards.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can create cards
CREATE POLICY "Organization members can create cards"
  ON cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = cards.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can update cards
CREATE POLICY "Organization members can update cards"
  ON cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = cards.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can delete cards
CREATE POLICY "Organization members can delete cards"
  ON cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = cards.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER cards_updated_at_trigger
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_cards_updated_at();
