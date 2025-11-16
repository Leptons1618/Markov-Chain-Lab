# Admin Authentication Setup Guide

The admin panel now uses Supabase authentication. Users must be authenticated and have admin privileges to access the admin panel.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Environment Variables**: Ensure these are set in your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin checks
   ```

   **Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for admin authentication checks. You can find it in:
   - Supabase Dashboard → Settings → API → `service_role` key (secret)

3. **Database Tables**: Ensure both tables exist:
   - `user_progress` (created by migration `001_user_progress.sql`)
   - `admin_users` (created by migration `002_admin_users.sql`)

## Setting Up Admin Users

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to add an admin user:

```sql
-- Replace 'user-email@example.com' with the email of the user you want to make an admin
-- First, get the user ID from auth.users table
INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'user-email@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

### Method 2: Using Supabase Dashboard

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Find the user you want to make an admin
3. Copy their User ID (UUID)
4. Go to **Table Editor** → **admin_users**
5. Click **Insert row**
6. Enter:
   - `user_id`: The UUID from step 3
   - `email`: The user's email address
7. Click **Save**

### Method 3: Quick Setup via Admin Setup Page

1. Sign up or sign in to your account
2. Go to `/admin/setup` page
3. Use the "Quick Add: Make Yourself Admin" section
4. Copy the SQL query
5. Run it in Supabase SQL Editor
6. Sign out and sign back in

## Admin Access Flow

1. **User signs in** via the auth dialog (email/password or Google OAuth)
2. **System checks** if user is in `admin_users` table (using service role key to bypass RLS)
3. **If admin**: User gains access to admin panel
4. **If not admin**: User sees "Access Denied" message

## Security Notes

- Admin users are stored in the `admin_users` table
- Only users listed in this table can access admin routes
- The table uses Row Level Security (RLS) policies that block all access
- Admin status is checked server-side using the service role key (bypasses RLS)
- Regular users cannot query the admin_users table
- **Keep your service role key secret** - never expose it in client-side code

## Troubleshooting

### "Access Denied" Error Even After Adding to admin_users

1. **Check Service Role Key**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. **Verify User ID**: Check if the user_id in `admin_users` matches the user's actual ID:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'user@example.com';
   SELECT * FROM admin_users WHERE email = 'user@example.com';
   ```
3. **Restart Dev Server**: After adding environment variables, restart your Next.js dev server
4. **Clear Browser Cache**: Sign out, clear cache, and sign back in
5. **Check Console**: Look for errors in browser console and server logs

### Progress Not Saving to Supabase

1. **Check RLS Policies**: Ensure `user_progress` table has correct RLS policies
2. **Verify User Authentication**: User must be signed in (not guest mode)
3. **Check Browser Console**: Look for errors when syncing progress
4. **Verify Table Exists**: Check Supabase dashboard that `user_progress` table exists

### Sign Out Not Working

1. **Clear Browser Cache**: Try clearing cache and cookies
2. **Check Console**: Look for JavaScript errors
3. **Try Private/Incognito Mode**: This helps identify cache issues
4. **Restart Dev Server**: Sometimes helps with state issues

## Removing Admin Access

To remove admin privileges:

```sql
DELETE FROM admin_users WHERE email = 'user-email@example.com';
```

## Multiple Admins

You can have multiple admin users. Simply add each user to the `admin_users` table:

```sql
INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email IN ('admin1@example.com', 'admin2@example.com', 'admin3@example.com')
ON CONFLICT (user_id) DO NOTHING;
```

## Best Practices

1. **Use strong passwords** or enable Google OAuth
2. **Limit admin users** to trusted personnel only
3. **Regularly audit** the admin_users table
4. **Use environment variables** for Supabase credentials
5. **Never commit** service role key to git
6. **Enable 2FA** in Supabase for additional security
7. **Monitor access logs** in Supabase dashboard
