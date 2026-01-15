import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'
import { useEffect } from 'react'
import { ZeroWrapper } from '@/components/ZeroWrapper'

export const Route = createFileRoute('/')({
  component: HomePage,
  ssr: false, // Disable SSR - Zero doesn't support SSR yet
})

function HomePage() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/login' })
    }
  }, [isPending, session, navigate])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <ZeroWrapper>
      <div className="flex min-h-screen flex-col bg-gray-900 text-white">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">Zero Place</h1>
            <p className="text-gray-400">Canvas coming soon...</p>
          </div>
        </div>
      </div>
    </ZeroWrapper>
  )
}
