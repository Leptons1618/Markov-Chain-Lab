# Authentication Setup Guide

This application uses Supabase for authentication with support for:
- Email/password authentication
- Google OAuth
- Guest mode (local storage only)
- Password reset functionality

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for the project to be provisioned

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   
   **Important:** `NEXT_PUBLIC_SITE_URL` is used for authentication redirects. Set it to your production URL when deploying.

### 4. Set Up Database Schema

Run the migration SQL in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_user_progress.sql`
4. Run the query

This creates:
- `user_progress` table to store user learning progress
- Row Level Security (RLS) policies
- Automatic timestamp updates

### 5. Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (or edit existing ones)
   - **CRITICAL:** Add ALL authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback` (Supabase callback - REQUIRED)
     - `https://your-production-domain.com/auth/callback` (Your production app - REQUIRED)
     - `http://localhost:3000/auth/callback` (Local development - optional)
   - Copy Client ID and Client Secret to Supabase
   
**Important:** Google OAuth requires the exact redirect URI to be registered. If you're getting "localhost refused to connect" errors, make sure your production URL is added to Google Cloud Console's authorized redirect URIs.

### 6. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates** in Supabase dashboard
2. Customize email templates for:
   - Confirm signup
   - Reset password
   - Magic link

### 7. Set Up Redirect URLs

**IMPORTANT: This is critical for production deployments!**

1. Go to **Authentication** → **URL Configuration** in Supabase dashboard
2. Set your **Site URL** to your production domain (e.g., `https://your-app.amplifyapp.com`)
3. Add redirect URLs (you can add multiple):
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-production-domain.com/auth/callback` (for production)
   - `https://your-app.amplifyapp.com/auth/callback` (if using AWS Amplify)

**Note:** The redirect URL must match exactly, including the protocol (http/https) and trailing path.

## Features

### Guest Mode

Users can continue without signing in. Their progress is stored locally in the browser's localStorage. A warning is shown that data may be lost if:
- Browser data is cleared
- User switches devices
- User uses a different browser

### Authenticated Mode

When users sign in:
- Progress is synced to Supabase
- Progress is available across devices
- Achievements and rewards are preserved
- Data persists even if browser data is cleared

### Progress Synchronization

- Progress automatically syncs to Supabase when authenticated
- On sign-in, local and remote progress are merged (remote takes precedence)
- Progress syncs after each lesson completion
- Progress syncs when switching between courses

## Troubleshooting

### Authentication Not Working

1. Check that environment variables are set correctly
2. Verify Supabase project is active
3. Check browser console for errors
4. Ensure redirect URLs are configured correctly

### Progress Not Syncing

1. Verify user is authenticated (not in guest mode)
2. Check browser console for sync errors
3. Verify `user_progress` table exists in Supabase
4. Check RLS policies are set correctly

### Google OAuth Not Working

1. Verify Google OAuth credentials are correct
2. Check redirect URI matches exactly
3. Ensure Google OAuth consent screen is configured
4. Check Supabase provider settings

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables in production
- RLS policies ensure users can only access their own data
- Supabase handles password hashing and security automatically

## Production Deployment

### AWS Amplify Deployment Checklist

1. **Set Environment Variables in AWS Amplify:**
   - Go to your Amplify app → **App settings** → **Environment variables**
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
     - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key (for admin features)
     - `NEXT_PUBLIC_SITE_URL` = Your Amplify app URL (e.g., `https://main.xxxxx.amplifyapp.com`)
   
   **CRITICAL:** `NEXT_PUBLIC_SITE_URL` must be set to your production domain. This ensures email confirmation links and OAuth redirects work correctly.

2. **Configure Supabase Redirect URLs:**
   - Go to Supabase Dashboard → **Authentication** → **URL Configuration**
   - Set **Site URL** to your Amplify app URL (e.g., `https://main.xxxxx.amplifyapp.com`)
   - Add **Redirect URLs**:
     - `https://your-amplify-app.amplifyapp.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

3. **Update Google OAuth Redirect URIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     - `https://your-project.supabase.co/auth/v1/callback` (Supabase callback)
     - `https://your-amplify-app.amplifyapp.com/auth/callback` (Your production app)
   - Click **Save**

4. **Verify Configuration:**
   - Ensure HTTPS is enabled (Amplify provides this automatically)
   - Test the authentication flow in production
   - Check browser console for any errors
   - Monitor Supabase dashboard → **Authentication** → **Logs** for issues

### Common Production Issues

**"localhost refused to connect" error:**
- ✅ **MOST IMPORTANT:** Set `NEXT_PUBLIC_SITE_URL` environment variable in Amplify to your production URL (e.g., `https://main.xxxxx.amplifyapp.com`)
- ✅ Check Supabase URL Configuration has your production URL
- ✅ Check Google Cloud Console has your production redirect URI
- ✅ Verify all environment variables are set correctly in Amplify
- ✅ Clear browser cache and try again
- ✅ After setting `NEXT_PUBLIC_SITE_URL`, redeploy your Amplify app

**Email confirmation not sending:**
- ✅ Ensure `NEXT_PUBLIC_SITE_URL` is set correctly in Amplify
- ✅ Check Supabase → Authentication → Email Templates are enabled
- ✅ Verify email confirmation is enabled in Supabase → Authentication → Settings
- ✅ Check Supabase → Authentication → Logs for email sending errors

**OAuth redirects to wrong domain:**
- The code now uses `NEXT_PUBLIC_SITE_URL` environment variable (with fallback to `window.location.origin`)
- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly in Amplify
- Verify Supabase Site URL matches your production domain exactly
