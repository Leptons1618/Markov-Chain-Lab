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
   ```

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
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### 6. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates** in Supabase dashboard
2. Customize email templates for:
   - Confirm signup
   - Reset password
   - Magic link

### 7. Set Up Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

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

1. Set environment variables in your hosting platform
2. Update redirect URLs in Supabase dashboard
3. Enable HTTPS (required for OAuth)
4. Test authentication flow thoroughly
5. Monitor Supabase dashboard for errors
