import { Link, useNavigate } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'

export default function Header() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
      <Link to="/" className="text-xl font-bold">
        Zero Place
      </Link>

      <div className="flex items-center gap-4">
        {isPending ? (
          <span className="text-sm text-gray-400">Loading...</span>
        ) : session ? (
          <>
            <span className="text-sm text-gray-300">{session.user.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
