import { createFileRoute } from '@tanstack/react-router'
import { mustGetMutator } from '@rocicorp/zero'
import { handleMutateRequest } from '@rocicorp/zero/server'
import { zeroPostgresJS } from '@rocicorp/zero/server/adapters/postgresjs'
import postgres from 'postgres'
import { nanoid } from 'nanoid'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { pixelHistory } from '@/db/schema'
import { schema, type AuthData } from '@/zero/schema'
import { mutators } from '@/zero/mutators'
import { PIXEL_COOLDOWN_MS } from '@/lib/constants'

// Create a postgres.js client for Zero
const sql = postgres(process.env.DATABASE_URL!)
const dbProvider = zeroPostgresJS(schema, sql)

// Track last placement time per user (in-memory for simplicity)
// In production, you might want to store this in Redis or the database
const lastPlacementTime = new Map<string, number>()

export const Route = createFileRoute('/api/zero/mutate')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // Try to get session from cookies (direct calls)
        // If not available, we'll get userID from the mutation args (via Cloud Zero)
        const session = await auth.api.getSession({ headers: request.headers })

        const result = await handleMutateRequest(
          dbProvider,
          (transact) =>
            transact(async (tx, name, args) => {
              // Get userID from session if available
              let userID: string | null = session?.user?.id ?? null

              // For pixel.place, we can also get userID from the mutation args
              // Cloud Zero validates the user and forwards the userID
              if (name === 'pixel.place') {
                // args could be an array [{ ... }] or the object directly
                const rawArgs = Array.isArray(args) ? args[0] : args
                const pixelArgs = rawArgs as {
                  id: string
                  x: number
                  y: number
                  color: string
                  placedBy: string
                  placedAt: number
                }

                // If no session cookie, trust placedBy from Cloud Zero
                if (!userID && pixelArgs?.placedBy) {
                  userID = pixelArgs.placedBy
                }

                if (!userID) {
                  throw new Error('Authentication required to place pixels')
                }

                const lastTime = lastPlacementTime.get(userID) ?? 0
                const now = Date.now()
                const timeSinceLastPlacement = now - lastTime

                if (timeSinceLastPlacement < PIXEL_COOLDOWN_MS) {
                  const remainingMs = PIXEL_COOLDOWN_MS - timeSinceLastPlacement
                  throw new Error(
                    `Cooldown active. Please wait ${Math.ceil(remainingMs / 1000)} seconds.`,
                  )
                }

                // Update last placement time
                lastPlacementTime.set(userID, now)

                // Record to pixel_history table using Drizzle
                await db.insert(pixelHistory).values({
                  id: nanoid(),
                  x: pixelArgs.x,
                  y: pixelArgs.y,
                  color: pixelArgs.color,
                  placedBy: pixelArgs.placedBy,
                  placedAt: new Date(pixelArgs.placedAt),
                })
              }

              const ctx: AuthData = { userID }
              const mutator = mustGetMutator(mutators, name)
              return mutator.fn({ tx, args, ctx })
            }),
          request,
        )

        return Response.json(result)
      },
    },
  },
})
