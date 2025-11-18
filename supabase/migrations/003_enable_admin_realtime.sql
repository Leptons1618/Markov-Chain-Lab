-- Enable Realtime for admin_users table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;

-- Drop the existing policy that blocks everything
DROP POLICY IF EXISTS "Only service role can manage admin users" ON admin_users;

-- Create separate policies:
-- 1. Allow users to SELECT their own row (needed for Realtime subscriptions)
CREATE POLICY "Users can view their own admin status"
  ON admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Block all INSERT/UPDATE/DELETE operations (only service role can do this)
CREATE POLICY "Only service role can manage admin users"
  ON admin_users
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update admin users"
  ON admin_users
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can delete admin users"
  ON admin_users
  FOR DELETE
  USING (false);
