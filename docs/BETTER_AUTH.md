# Better Auth

Better Auth is a framework-agnostic authentication library for TypeScript. We're using it with Email OTP for passwordless authentication.

## Installation

```bash
bun add better-auth
```

## Environment Variables

```env
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-character-secret-key-here

# Base URL of your app
BETTER_AUTH_URL=http://localhost:3000
```

## Database Tables

Better Auth requires these tables (generate with `npx @better-auth/cli generate`):

**`user`**

- `id` (text, PK)
- `name` (text)
- `email` (text, unique)
- `email_verified` (boolean)
- `image` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**`session`**

- `id` (text, PK)
- `user_id` (text, FK → user)
- `token` (text, unique)
- `expires_at` (timestamp)
- `ip_address` (text, optional)
- `user_agent` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**`account`**

- `id` (text, PK)
- `user_id` (text, FK → user)
- `account_id` (text)
- `provider_id` (text)
- `access_token` (text, optional)
- `refresh_token` (text, optional)
- `password` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**`verification`** (used by Email OTP)

- `id` (text, PK)
- `identifier` (text)
- `value` (text)
- `expires_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Server Setup

```typescript
// src/lib/auth.ts
import { randomInt } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes

      // Hardcode OTP in development
      generateOTP: () => {
        if (process.env.NODE_ENV === 'development') {
          return '424242'
        }
        // Cryptographically secure, supports leading zeros
        return randomInt(0, 1000000).toString().padStart(6, '0')
      },

      // Send OTP (log in dev, email in prod)
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${email}: ${otp}`)
          return
        }
        // Production: send actual email
        await sendEmail({ to: email, subject: 'Your code', body: otp })
      },
    }),

    // Must be last
    tanstackStartCookies(),
  ],
})

export type Auth = typeof auth
```

## API Route

```typescript
// src/routes/api/auth/$.ts
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
```

## Client Setup

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
})

export const { useSession, signOut } = authClient
```

## Email OTP Flow

### Step 1: Send OTP

```typescript
const { error } = await authClient.emailOtp.sendVerificationOtp({
  email: 'user@example.com',
  type: 'sign-in',
})
```

### Step 2: Verify OTP & Sign In

```typescript
const { data, error } = await authClient.signIn.emailOtp({
  email: 'user@example.com',
  otp: '424242',
})

if (data) {
  // User is signed in
  console.log(data.user)
}
```

## Session Management

### Client-Side Hook

```tsx
import { useSession } from '@/lib/auth-client'

function UserMenu() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) return <a href="/login">Sign In</a>

  return (
    <div>
      <span>{session.user.email}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### Server-Side

```typescript
import { auth } from '@/lib/auth'

// In a server function or middleware
const session = await auth.api.getSession({
  headers: request.headers,
})

if (session) {
  console.log(session.user.id)
}
```

## Login Component Example

```tsx
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useNavigate } from '@tanstack/react-router'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await authClient.signIn.emailOtp({
      email,
      otp,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate({ to: '/' })
    }
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleSendOtp}>
        <h2>Sign In</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Code'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp}>
      <h2>Enter Code</h2>
      <p>We sent a code to {email}</p>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      <button type="button" onClick={() => setStep('email')}>
        Back
      </button>
    </form>
  )
}
```

## Email OTP Plugin Options

| Option                | Type     | Default  | Description               |
| --------------------- | -------- | -------- | ------------------------- |
| `otpLength`           | number   | 6        | Length of OTP             |
| `expiresIn`           | number   | 300      | Expiry in seconds         |
| `allowedAttempts`     | number   | 3        | Max verification attempts |
| `disableSignUp`       | boolean  | false    | Prevent auto-signup       |
| `generateOTP`         | function | random   | Custom OTP generator      |
| `sendVerificationOTP` | function | required | Function to send OTP      |

## Resources

- **Docs**: https://www.better-auth.com
- **Email OTP Plugin**: https://www.better-auth.com/docs/plugins/email-otp
- **TanStack Start Integration**: https://www.better-auth.com/docs/integrations/tanstack-start
