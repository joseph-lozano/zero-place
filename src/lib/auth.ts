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

  // Enable cross-subdomain cookies so Zero at zero.place.eureka.dev
  // can receive cookies set by place.eureka.dev
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: '.eureka.dev', // Note the leading dot
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes

      // Hardcode OTP in development
      generateOTP: () => {
        if (process.env.NODE_ENV === 'development') {
          return '424242'
        }
        return randomInt(0, 1000000).toString().padStart(6, '0')
      },

      // Send OTP (log in dev, email in prod)
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${email}: ${otp} (type: ${type})`)
          return
        }
        // Production: implement actual email sending
        // await sendEmail({ to: email, subject: "Your code", body: otp });
        console.log(`[PROD] Would send OTP ${otp} to ${email}`)
      },
    }),
    tanstackStartCookies(), // must be last
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session expiry every 1 day
  },
})

export type Auth = typeof auth
