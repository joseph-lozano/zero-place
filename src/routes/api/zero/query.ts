import { createFileRoute } from '@tanstack/react-router'
import { mustGetQuery } from '@rocicorp/zero'
import { handleQueryRequest } from '@rocicorp/zero/server'
import { auth } from '@/lib/auth'
import { schema, type AuthData } from '@/zero/schema'
import { queries } from '@/zero/queries'

export const Route = createFileRoute('/api/zero/query')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // Get user session
        const session = await auth.api.getSession({ headers: request.headers })
        const ctx: AuthData = { userID: session?.user?.id ?? null }

        const result = await handleQueryRequest(
          (name, args) => mustGetQuery(queries, name).fn({ args, ctx }),
          schema,
          request,
        )

        return Response.json(result)
      },
    },
  },
})
