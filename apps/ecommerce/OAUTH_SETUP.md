# OAuth Setup Guide

This guide will help you configure Google OAuth authentication for the e-commerce application.

## Prerequisites

1. A Supabase project
2. A Google Cloud Platform project with OAuth credentials

## Step 1: Configure Google OAuth Provider

### 1.1 Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Add your redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
7. Save and copy the **Client ID** and **Client Secret**

### 1.2 Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and enable it
4. Paste your Google **Client ID** and **Client Secret**
5. Under **Site URL**, set your production URL (e.g., `https://www.tallaby.com`)
6. Under **Redirect URLs**, add:
   ```
   https://www.tallaby.com/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `apps/ecommerce` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (REQUIRED for OAuth)
NEXT_PUBLIC_SITE_URL=https://www.tallaby.com

# For local development, use:
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Important Notes:

- **`NEXT_PUBLIC_SITE_URL`** is **required** for OAuth to work correctly
- The URL should **not** have a trailing slash
- For local development, use `http://localhost:3000`
- For production, use your actual domain (e.g., `https://www.tallaby.com`)

## Step 3: Test OAuth Flow

1. Start your development server:

   ```bash
   pnpm dev
   ```

2. Navigate to the login page
3. Click the **Google** sign-in button
4. You should be redirected to Google's OAuth consent screen
5. After authorizing, you should be redirected back to your app

## Debugging OAuth Issues

The OAuth flow now includes detailed logging. Check your server console for logs prefixed with:

- `[OAuth]` - OAuth initiation logs
- `[OAuth Callback]` - OAuth callback processing logs

### Common Issues:

#### Issue: "Authentication Failed" error page

**Possible causes:**

1. **Missing `NEXT_PUBLIC_SITE_URL`**: Ensure this environment variable is set
2. **Redirect URL mismatch**: Verify the redirect URL in Supabase matches exactly
3. **Invalid credentials**: Check your Google OAuth credentials
4. **Expired code**: OAuth codes expire after 10 minutes - try again

**Solution:**

- Check the server console logs for detailed error information
- Verify all environment variables are set correctly
- Ensure the redirect URL is whitelisted in both Google and Supabase

#### Issue: Code not being exchanged for session

**Possible causes:**

1. OAuth code has expired
2. Code has already been used
3. Invalid Supabase configuration

**Solution:**

- Try the OAuth flow again (codes are single-use)
- Check Supabase logs in the dashboard
- Verify your Supabase project is active

#### Issue: Redirect loop or blank page

**Possible causes:**

1. `NEXT_PUBLIC_SITE_URL` doesn't match the actual domain
2. Cookie issues (third-party cookies blocked)

**Solution:**

- Ensure `NEXT_PUBLIC_SITE_URL` matches your actual domain
- Check browser console for cookie errors
- Try in an incognito/private window

## OAuth Flow Diagram

```
User clicks "Sign in with Google"
         ↓
OAuth component initiates flow with redirectTo: /api/auth/callback
         ↓
User is redirected to Google OAuth consent screen
         ↓
User authorizes the application
         ↓
Google redirects to: /api/auth/callback?code=xxx&next=/
         ↓
Callback handler exchanges code for session
         ↓
User is redirected to the 'next' parameter (or home page)
```

## Security Considerations

1. **Never commit** `.env.local` files to version control
2. **Rotate credentials** if they are ever exposed
3. **Use HTTPS** in production (required by Google)
4. **Limit OAuth scopes** to only what you need
5. **Monitor** Supabase logs for suspicious activity

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Add production redirect URL to Google OAuth credentials
- [ ] Add production redirect URL to Supabase allowed redirect URLs
- [ ] Verify OAuth works in production environment
- [ ] Set up error monitoring for OAuth failures
- [ ] Test OAuth flow on different devices/browsers

## Support

If you continue to experience issues:

1. Check the server console logs for detailed error messages
2. Review Supabase logs in the dashboard
3. Verify all configuration steps were completed
4. Test with a different OAuth provider (if enabled)

For more information, see:

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
