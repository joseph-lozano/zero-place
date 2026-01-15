import { ZeroProvider } from '@rocicorp/zero/react'
import { useSession } from '@/lib/auth-client'
import { schema, type AuthData } from '@/zero/schema'
import { mutators } from '@/zero/mutators'

const ZERO_CACHE_URL =
  import.meta.env.VITE_ZERO_CACHE_URL ?? 'http://localhost:4848'

interface ZeroWrapperProps {
  children: React.ReactNode
}

export function ZeroWrapper({ children }: ZeroWrapperProps) {
  const { data: session, isPending } = useSession()

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  const userID = session?.user?.id ?? 'anon'
  const context: AuthData = { userID: session?.user?.id ?? null }

  return (
    <ZeroProvider
      userID={userID}
      cacheURL={ZERO_CACHE_URL}
      schema={schema}
      mutators={mutators}
      context={context}
    >
      {children}
    </ZeroProvider>
  )
}
