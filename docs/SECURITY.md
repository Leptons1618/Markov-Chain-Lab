# Security Guide - Admin Authentication

## Current Issue ⚠️

The admin panel currently uses a **hardcoded password** (`"admin123"`) directly in the client-side code, which is:

- ❌ Visible to anyone who inspects the JavaScript
- ❌ The same in development and production
- ❌ Not secure for production use
- ❌ Cannot be changed without redeploying code

## Recommended Solution for Production

### Option 1: Environment Variable + Server-Side Validation (Recommended)

This is the **best approach for a simple admin panel** without full authentication infrastructure.

#### Step 1: Create Environment Variables

Create a `.env.local` file in your project root (this file is already gitignored):

```bash
# .env.local (DO NOT commit this file)
ADMIN_PASSWORD=your-strong-password-here-change-this
# Optional: Add a secret for JWT if you want session tokens
NEXTAUTH_SECRET=your-random-secret-key-32-chars-min
```

For production, set these as **environment variables** in your hosting platform's dashboard.

#### Step 2: Create Server-Side Auth API Route

Create `app/api/admin/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Get password from environment variable
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not set in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Validate password
    if (password === ADMIN_PASSWORD) {
      // In production, you might want to use JWT or session cookies
      // For now, just return success
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful' 
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
```

#### Step 3: Update Admin Page to Use API

Modify `app/admin/page.tsx`:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError("")
  
  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      setIsAuthenticated(true)
      // Optional: Store auth token in sessionStorage
      sessionStorage.setItem('admin-auth', 'true')
    } else {
      setError(data.error || 'Invalid password')
    }
  } catch (error) {
    setError('Authentication failed')
  } finally {
    setLoading(false)
  }
}
```

#### Step 4: Add Session Persistence (Optional)

To maintain login across page refreshes:

```typescript
// In AdminPage component, add useEffect
useEffect(() => {
  const isAuth = sessionStorage.getItem('admin-auth')
  if (isAuth === 'true') {
    setIsAuthenticated(true)
  }
}, [])

// Update logout handler
const handleLogout = () => {
  setIsAuthenticated(false)
  sessionStorage.removeItem('admin-auth')
}
```

### Option 2: NextAuth.js (More Robust)

For a more complete solution with session management:

#### Install NextAuth

```bash
npm install next-auth
```

#### Configure NextAuth

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Admin Credentials',
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.ADMIN_PASSWORD) {
          return { id: "admin", name: "Admin" }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
```

#### Protect Admin Routes with Middleware

Create `middleware.ts` in project root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Protect admin routes
  if (path.startsWith('/admin')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token && path !== '/admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
```

### Option 3: Third-Party Auth (Most Secure)

For production apps with multiple admins:

- **Clerk** (https://clerk.com) - Easy to integrate, generous free tier
- **Auth0** (https://auth0.com) - Enterprise-grade
- **Supabase Auth** (https://supabase.com) - Open source, includes database
- **Firebase Auth** (https://firebase.google.com) - Google's solution

## Comparison

| Solution | Complexity | Security | Best For |
|----------|-----------|----------|----------|
| **Env Variable + API** | Low | Medium | Single admin, simple apps |
| **NextAuth.js** | Medium | High | Multiple admins, sessions |
| **Third-Party** | Low-Medium | Very High | Production apps, teams |

## Security Best Practices

### 1. Password Requirements

- ✅ Minimum 16 characters
- ✅ Mix of uppercase, lowercase, numbers, symbols
- ✅ Use a password manager to generate
- ✅ Rotate every 90 days

### 2. Environment Variables

```bash
# Good password example (generate with password manager)
ADMIN_PASSWORD=Xk9$mP2#vN8@qL5&wR7!zT4

# Bad passwords (DO NOT USE)
admin123
password
MarkovLearn2024
```

### 3. Additional Security Layers

#### Rate Limiting

Prevent brute force attacks:

```typescript
// Simple rate limiting example
const loginAttempts = new Map<string, number>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const attempts = loginAttempts.get(ip) || 0
  
  if (attempts > 5) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }
  
  // ... rest of auth logic
  
  // On failure:
  loginAttempts.set(ip, attempts + 1)
  setTimeout(() => loginAttempts.delete(ip), 15 * 60 * 1000)
}
```

#### IP Whitelisting

For highly sensitive admin panels:

```typescript
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || []

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')
  
  if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip || '')) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // ... rest of auth logic
}
```

#### HTTPS Only

Ensure your hosting platform uses HTTPS (all modern platforms do by default).

#### Security Headers

Add to `next.config.mjs`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## Implementation Checklist

- [ ] Remove hardcoded password from client code
- [ ] Create `.env.local` with strong password
- [ ] Add `ADMIN_PASSWORD` to hosting environment variables
- [ ] Implement server-side auth API route
- [ ] Update admin page to call auth API
- [ ] Add rate limiting
- [ ] Test authentication flow
- [ ] Add session persistence (optional)
- [ ] Configure security headers
- [ ] Document admin access procedure for team

## Quick Start (Recommended Solution)

1. **Create `.env.local`:**
   ```bash
   ADMIN_PASSWORD=your-very-strong-password-here
   ```

2. **Create auth API:** (see Step 2 above)

3. **Update admin page:** (see Step 3 above)

4. **Deploy:** Set `ADMIN_PASSWORD` in your hosting platform

5. **Test:** Try logging in with correct and incorrect passwords

## Emergency Access Recovery

If you forget the admin password:

1. **Local development:** Check `.env.local`
2. **Deployed instance:** Check environment variables in hosting dashboard
3. **Lost access:** Redeploy with new password in environment variables

## Questions?

See the main README.md or create an issue.
