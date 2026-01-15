import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'
import { useCallback, useEffect, useState } from 'react'
import { ZeroWrapper } from '@/components/ZeroWrapper'
import { Canvas } from '@/components/Canvas'
import { ColorPicker } from '@/components/ColorPicker'
import { PixelInfo } from '@/components/PixelInfo'
import { COLORS, type ColorHex } from '@/lib/constants'
import type { Pixel, User } from '@/zero/schema'

export const Route = createFileRoute('/')({
  component: HomePage,
  ssr: false, // Disable SSR - Zero doesn't support SSR yet
})

// Pixel with optional user relation
type PixelWithUser = Pixel & { user?: User | null }

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <ZeroWrapper>
      <CanvasPage userId={session.user.id} />
    </ZeroWrapper>
  )
}

interface CanvasPageProps {
  userId: string
}

function CanvasPage({ userId }: CanvasPageProps) {
  // Selected color state
  const [selectedColor, setSelectedColor] = useState<ColorHex>(COLORS[0].hex)

  // Hovered pixel state
  const [hoveredPixel, setHoveredPixel] = useState<PixelWithUser | null>(null)
  const [hoveredCoords, setHoveredCoords] = useState({ x: -1, y: -1 })

  // Handle pixel hover
  const handlePixelHover = useCallback(
    (pixel: PixelWithUser | null, x: number, y: number) => {
      setHoveredPixel(pixel)
      setHoveredCoords({ x, y })
    },
    [],
  )

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4 lg:p-8">
        {/* Main content area */}
        <div className="flex flex-col items-center gap-8 xl:flex-row xl:items-start xl:gap-12">
          {/* Canvas */}
          <div className="relative">
            <Canvas
              selectedColor={selectedColor}
              userId={userId}
              onPixelHover={handlePixelHover}
            />
          </div>

          {/* Sidebar */}
          <div className="flex w-full max-w-xs flex-col gap-6 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm xl:w-80">
            <h2 className="text-lg font-semibold text-slate-200">Tools</h2>

            {/* Color picker */}
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />

            <div className="h-px bg-white/10" />

            {/* Pixel info */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-slate-400">Info</h3>
              <PixelInfo
                pixel={hoveredPixel}
                x={hoveredCoords.x}
                y={hoveredCoords.y}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
