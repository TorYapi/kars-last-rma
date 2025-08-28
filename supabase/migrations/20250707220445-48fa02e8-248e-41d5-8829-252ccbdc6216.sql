-- Clean up duplicate RLS policies on user_sessions table

-- Remove duplicate policies
DROP POLICY IF EXISTS "Only admins can view all sessions" ON user_sessions;

-- Keep only the necessary policies:
-- 1. Users can view their own sessions (already exists)
-- 2. Users can insert their own sessions (already exists) 
-- 3. Users can update their own sessions (already exists)
-- 4. Admins can view all sessions (already exists)

-- Add missing DELETE policy for admins
CREATE POLICY "Admins can delete sessions"
ON user_sessions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Optimize profiles policies - remove potential conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create optimized admin policy for profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR role = 'admin'::user_role 
  OR get_current_user_role() = 'admin'::user_role
);

-- Add missing INSERT policy for profiles (for admin use)
CREATE POLICY "Admins can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = 'admin'::user_role
);

-- Add INDEX for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id_type ON user_activities (user_id, activity_type);

-- Create a more efficient index for search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_results_count ON search_queries (results_count) WHERE results_count = 0;