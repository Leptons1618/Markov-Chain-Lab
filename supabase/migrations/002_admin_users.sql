-- Create admin_users table to store admin users
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin_users table
-- Note: This is a bit circular, but we'll use service role for admin operations
-- Regular users cannot query this table
CREATE POLICY "Only service role can manage admin users"
  ON admin_users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Helper function to check if user is admin (for use in RLS policies)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
