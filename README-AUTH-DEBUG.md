# Authentication Debugging Guide 🔧

This guide helps you debug and fix authentication issues in the DevLink application.

## 🚨 Common Authentication Issues Fixed

### 1. Missing Route Protection
**Fixed:** Added middleware.ts for proper route protection and authentication flow

### 2. Redirect Loops
**Fixed:** Improved NextAuth configuration and removed problematic sign-out/sign-in loop in setup

### 3. Incomplete OAuth Setup
**Fixed:** Made GitHub OAuth optional and improved error handling

### 4. Session Management Issues
**Fixed:** Enhanced JWT callback to always fetch latest user data

## 🧪 Testing Your Setup

Run the authentication test script to verify everything is working:

```bash
npm run test:auth
```

This will check:
- ✅ Environment variables
- ✅ Database connectivity
- ✅ OAuth provider configuration

## 🔧 Environment Setup

### Required Variables (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI=mongodb://localhost:27017/devfolio
```

### Optional GitHub OAuth
To enable GitHub login, uncomment and update these in .env.local:
```env
GITHUB_CLIENT_ID=your-actual-github-client-id
GITHUB_CLIENT_SECRET=your-actual-github-client-secret
```

## 🐛 Debugging Steps

### 1. Check MongoDB Connection
```bash
# For local MongoDB
mongod --version

# Test connection
npm run test:auth
```

### 2. Verify OAuth Credentials
- **Google**: Check [Google Cloud Console](https://console.cloud.google.com/)
- **GitHub**: Check [GitHub Developer Settings](https://github.com/settings/developers)

### 3. Clear Browser Data
Authentication issues can be caused by stale sessions:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear cookies for localhost:3000
4. Clear Local Storage

### 4. Check Network Requests
1. Open DevTools Network tab
2. Try signing in
3. Look for failed requests to `/api/auth/*`

## 🔄 Authentication Flow

1. **User clicks sign in** → Redirected to `/auth/signin`
2. **Clicks OAuth provider** → Redirected to provider (Google/GitHub)
3. **Provider authentication** → User grants permissions
4. **Callback to NextAuth** → `POST /api/auth/callback/[provider]`
5. **NextAuth processes** → Creates/updates user in database
6. **Session created** → JWT token with user info
7. **Middleware checks** → Route protection and redirects
8. **Dashboard access** → User profile setup or main dashboard

## 🛡️ Route Protection

The middleware.ts handles:
- ✅ Protecting dashboard routes (requires authentication)
- ✅ Redirecting authenticated users from auth pages
- ✅ Setup flow (username required for dashboard access)
- ✅ Proper redirect handling with 'from' parameter

## 📝 User Setup Flow

1. **New user signs in** → Created in database without username
2. **Redirected to setup** → `/dashboard/setup`
3. **Chooses username** → Updates user record
4. **Redirected to dashboard** → Full access granted

## 🚫 Common Errors & Solutions

### "Configuration" Error
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain

### "OAuthCallback" Error
- Check OAuth redirect URLs in provider settings
- Verify client ID and secret are correct

### "SessionRequired" Error
- Clear browser cookies and try again
- Check if middleware is properly configured

### Infinite Redirects
- Clear browser data
- Check middleware.ts logic
- Verify JWT callback is working

### Database Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB (macOS)
brew services start mongodb-community

# Check connection
npm run test:auth
```

## 🔍 Debugging Tools

### 1. NextAuth Debug Mode
Add to .env.local:
```env
NEXTAUTH_DEBUG=true
```

### 2. Console Logging
Check browser console and terminal for:
- Authentication errors
- Database connection issues
- JWT callback errors

### 3. Network Tab
Monitor requests to:
- `/api/auth/signin/[provider]`
- `/api/auth/callback/[provider]`
- `/api/auth/session`

## 📞 Getting Help

If you're still having issues:

1. ✅ Run `npm run test:auth` and fix any errors
2. ✅ Check browser console for JavaScript errors
3. ✅ Verify your .env.local configuration
4. ✅ Clear browser data and try again
5. ✅ Check MongoDB is running and accessible

## 🎉 Success Indicators

Your authentication is working correctly when:
- ✅ `npm run test:auth` passes all checks
- ✅ Google sign-in works without errors
- ✅ New users can complete setup flow
- ✅ Existing users can access dashboard
- ✅ Route protection works (can't access dashboard without auth)
- ✅ Proper redirects after sign-in
