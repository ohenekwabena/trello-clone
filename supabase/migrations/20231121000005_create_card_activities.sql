-- Create card_activities table for tracking all card changes
CREATE TABLE IF NOT EXISTS card_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity types:
-- 'card_created' - Card was created
-- 'card_updated' - Card title/description changed
-- 'card_moved' - Card moved between lists
-- 'card_assigned' - User assigned to card
-- 'card_unassigned' - User unassigned from card
-- 'card_due_date_set' - Due date was set
-- 'card_due_date_changed' - Due date was changed
-- 'card_due_date_removed' - Due date was removed
-- 'comment_added' - Comment was added (future feature)

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_card_activities_card_id ON card_activities(card_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_board_id ON card_activities(board_id);
CREATE INDEX IF NOT EXISTS idx_card_activities_created_at ON card_activities(card_id, created_at DESC);

-- Enable RLS
ALTER TABLE card_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_activities

-- Users can view activities if they are members of the organization that owns the board
CREATE POLICY "Users can view card activities in their organization boards"
  ON card_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = card_activities.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organization members can create activities (system-generated)
CREATE POLICY "Organization members can create card activities"
  ON card_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      JOIN organization_members ON organization_members.org_id = boards.org_id
      WHERE boards.id = card_activities.board_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Function to create activity when card is created
CREATE OR REPLACE FUNCTION create_card_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
  VALUES (
    NEW.id,
    NEW.board_id,
    NEW.created_by,
    'card_created',
    jsonb_build_object(
      'title', NEW.title,
      'list_id', NEW.list_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create activity when card is created
CREATE TRIGGER card_created_activity_trigger
  AFTER INSERT ON cards
  FOR EACH ROW
  EXECUTE FUNCTION create_card_activity();

-- Function to create activity when card is moved between lists
CREATE OR REPLACE FUNCTION create_card_move_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if list_id changed
  IF OLD.list_id IS DISTINCT FROM NEW.list_id THEN
    INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
    VALUES (
      NEW.id,
      NEW.board_id,
      auth.uid(),
      'card_moved',
      jsonb_build_object(
        'from_list_id', OLD.list_id,
        'to_list_id', NEW.list_id,
        'old_position', OLD.position,
        'new_position', NEW.position
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create activity when card is moved
CREATE TRIGGER card_moved_activity_trigger
  AFTER UPDATE ON cards
  FOR EACH ROW
  WHEN (OLD.list_id IS DISTINCT FROM NEW.list_id)
  EXECUTE FUNCTION create_card_move_activity();

-- Function to create activity when card fields are updated
CREATE OR REPLACE FUNCTION create_card_update_activity()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::jsonb;
BEGIN
  -- Track title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    changes := changes || jsonb_build_object(
      'title_changed', true,
      'old_title', OLD.title,
      'new_title', NEW.title
    );
  END IF;

  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    changes := changes || jsonb_build_object(
      'description_changed', true
    );
  END IF;

  -- Track assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
      VALUES (
        NEW.id,
        NEW.board_id,
        auth.uid(),
        'card_assigned',
        jsonb_build_object('assigned_to', NEW.assigned_to)
      );
    ELSE
      INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
      VALUES (
        NEW.id,
        NEW.board_id,
        auth.uid(),
        'card_unassigned',
        jsonb_build_object('was_assigned_to', OLD.assigned_to)
      );
    END IF;
  END IF;

  -- Track due date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    IF OLD.due_date IS NULL AND NEW.due_date IS NOT NULL THEN
      INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
      VALUES (
        NEW.id,
        NEW.board_id,
        auth.uid(),
        'card_due_date_set',
        jsonb_build_object('due_date', NEW.due_date)
      );
    ELSIF OLD.due_date IS NOT NULL AND NEW.due_date IS NULL THEN
      INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
      VALUES (
        NEW.id,
        NEW.board_id,
        auth.uid(),
        'card_due_date_removed',
        jsonb_build_object('was_due_date', OLD.due_date)
      );
    ELSE
      INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
      VALUES (
        NEW.id,
        NEW.board_id,
        auth.uid(),
        'card_due_date_changed',
        jsonb_build_object(
          'old_due_date', OLD.due_date,
          'new_due_date', NEW.due_date
        )
      );
    END IF;
  END IF;

  -- Log general update if title or description changed
  IF changes != '{}'::jsonb THEN
    INSERT INTO card_activities (card_id, board_id, actor_id, activity_type, payload)
    VALUES (
      NEW.id,
      NEW.board_id,
      auth.uid(),
      'card_updated',
      changes
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create activity when card is updated
CREATE TRIGGER card_updated_activity_trigger
  AFTER UPDATE ON cards
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.description IS DISTINCT FROM NEW.description
  )
  EXECUTE FUNCTION create_card_update_activity();
