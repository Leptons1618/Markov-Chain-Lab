# Troubleshooting Guide

## Authentication Issues

### Sign In/Sign Up Button Not Showing

**Problem:** The "Sign In" button doesn't appear in the navigation bar.

**Solution:**
1. Check that your `.env.local` file exists and contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Restart your development server after adding environment variables:
   ```bash
   npm run dev
   ```

3. Check browser console for errors - look for messages about missing Supabase variables

4. Verify the variables are loaded:
   - Open browser DevTools (F12)
   - Check Console tab for any Supabase-related errors
   - The button should appear even if Supabase isn't configured (it will show an error when clicked)

### Fast Refresh Errors

**Problem:** Seeing "Fast Refresh had to perform a full reload due to a runtime error" in terminal.

**Common Causes:**
1. **Syntax errors** - Check for typos or missing imports
2. **Environment variables not loaded** - Restart dev server after adding `.env.local`
3. **React hooks errors** - Make sure hooks are called at the top level of components

**Solution:**
1. Check browser console for the actual error message
2. Look at the terminal output - it usually shows which file has the error
3. Restart the dev server: `npm run dev`
4. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Supabase Connection Issues

**Problem:** Authentication doesn't work even with credentials set.

**Checklist:**
1. ✅ Verify `.env.local` file exists in project root
2. ✅ Check variables start with `NEXT_PUBLIC_`
3. ✅ No quotes around values in `.env.local`
4. ✅ Restart dev server after changes
5. ✅ Check Supabase project is active (not paused)
6. ✅ Verify URL format: `https://xxxxx.supabase.co` (not `https://app.supabase.com/...`)

**Test Connection:**
1. Open browser console
2. Type: `localStorage.getItem('sb-...')` (check if Supabase is storing session)
3. Check Network tab for requests to `supabase.co` domain

### Environment Variables Not Loading

**Problem:** Variables are set but not being read by the app.

**Solution:**
1. Make sure file is named exactly `.env.local` (not `.env` or `.env.example`)
2. File must be in project root (same level as `package.json`)
3. Restart dev server completely (stop and start again)
4. For Next.js, variables starting with `NEXT_PUBLIC_` are exposed to browser
5. Check `.gitignore` includes `.env.local` (it should)

**Verify:**
```bash
# Check if file exists
ls -la .env.local

# Check contents (be careful not to commit secrets!)
cat .env.local | grep SUPABASE
```

## Common Errors

### "Supabase client not initialized"
- **Cause:** Environment variables missing or not loaded
- **Fix:** Add variables to `.env.local` and restart server

### "Failed to get session"
- **Cause:** Supabase project paused or URL incorrect
- **Fix:** Check Supabase dashboard, verify project is active

### "Module not found" errors
- **Cause:** Dependencies not installed
- **Fix:** Run `npm install` or `pnpm install`

### Fast Refresh errors
- **Cause:** Runtime error in component
- **Fix:** Check browser console for actual error, fix the code issue

## Getting Help

1. **Check browser console** - Most errors show there first
2. **Check terminal** - Server-side errors appear in terminal
3. **Verify Supabase setup** - Follow `docs/AUTHENTICATION_SETUP.md`
4. **Check environment variables** - Use `echo $NEXT_PUBLIC_SUPABASE_URL` (Linux/Mac) or check `.env.local`

## Still Having Issues?

1. Clear browser cache and localStorage
2. Restart dev server
3. Check Supabase dashboard for project status
4. Verify network connectivity to Supabase
5. Check if other Supabase features work (if any)
