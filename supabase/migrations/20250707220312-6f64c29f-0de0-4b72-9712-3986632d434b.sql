-- Fix duplicate session_id issue in user_sessions table
-- Remove the unique constraint on session_id since multiple sessions can have the same ID over time

-- Drop the unique constraint on session_id
DROP INDEX IF EXISTS user_sessions_session_id_key;

-- Keep the regular index for performance but remove uniqueness
-- (idx_user_sessions_session_id already exists as a regular index)

-- Add a compound unique constraint on user_id and session_id if needed for business logic
-- This allows same session_id across different users but prevents duplicate sessions per user
-- ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_session_unique UNIQUE (user_id, session_id);

-- Update RLS policies to handle session management better
-- Remove any existing policies that might conflict
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;

-- Create more specific policies for session management
CREATE POLICY "Users can view their own sessions" 
ON user_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own sessions" 
ON user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own sessions" 
ON user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL)
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all sessions" 
ON user_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Add a function to handle session updates with conflict resolution
CREATE OR REPLACE FUNCTION public.upsert_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_page_views INTEGER DEFAULT 1,
  p_actions_count INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid UUID;
BEGIN
  -- Try to update existing session
  UPDATE user_sessions 
  SET 
    ended_at = NULL,
    page_views = page_views + p_page_views,
    actions_count = actions_count + p_actions_count,
    duration_minutes = EXTRACT(EPOCH FROM (now() - started_at)) / 60
  WHERE user_id = p_user_id 
    AND session_id = p_session_id
    AND ended_at IS NULL
  RETURNING id INTO v_session_uuid;

  -- If no active session found, create new one
  IF v_session_uuid IS NULL THEN
    INSERT INTO user_sessions (user_id, session_id, page_views, actions_count)
    VALUES (p_user_id, p_session_id, p_page_views, p_actions_count)
    RETURNING id INTO v_session_uuid;
  END IF;

  RETURN v_session_uuid;
END;
$$;