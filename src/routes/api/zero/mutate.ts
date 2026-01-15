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
        // Get user session
        const session = await auth.api.getSession({ headers: request.headers })
        const ctx: AuthData = { userID: session?.user?.id ?? null }

        const result = await handleMutateRequest(
          dbProvider,
          (transact) =>
            transact(async (tx, name, args) => {
              // Enforce cooldown for pixel.place mutations
              if (name === 'pixel.place') {
                if (!ctx.userID) {
                  throw new Error('Authentication required to place pixels')
                }

                const lastTime = lastPlacementTime.get(ctx.userID) ?? 0
                const now = Date.now()
                const timeSinceLastPlacement = now - lastTime

                if (timeSinceLastPlacement < PIXEL_COOLDOWN_MS) {
                  const remainingMs = PIXEL_COOLDOWN_MS - timeSinceLastPlacement
                  throw new Error(
                    `Cooldown active. Please wait ${Math.ceil(remainingMs / 1000)} seconds.`,
                  )
                }

                // Update last placement time
                lastPlacementTime.set(ctx.userID, now)

                // Record to pixel_history table using Drizzle
                // This happens outside of Zero's transaction but that's OK for history
                const pixelArgs = args as {
                  id: string
                  x: number
                  y: number
                  color: string
                  placedBy: string
                  placedAt: number
                }

                await db.insert(pixelHistory).values({
                  id: nanoid(),
                  x: pixelArgs.x,
                  y: pixelArgs.y,
                  color: pixelArgs.color,
                  placedBy: pixelArgs.placedBy,
                  placedAt: new Date(pixelArgs.placedAt),
                })
              }

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
