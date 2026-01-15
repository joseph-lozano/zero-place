import { Link, useNavigate } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
      <Link
        to="/"
        className="flex items-center gap-2 text-xl font-bold text-white transition-opacity hover:opacity-80"
      >
        <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500" />
        Zero Place
      </Link>

      <div className="flex items-center gap-4">
        {isPending ? (
          <span className="text-sm text-slate-400">Loading...</span>
        ) : session ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <User size={16} />
              <span className="hidden sm:inline">{session.user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
