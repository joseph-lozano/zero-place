import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'
import { useCallback, useEffect, useState } from 'react'
import { ZeroWrapper } from '@/components/ZeroWrapper'
import { Canvas } from '@/components/Canvas'
import { ColorPicker } from '@/components/ColorPicker'
import { CooldownTimer } from '@/components/CooldownTimer'
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

  // Cooldown state
  const [lastPlacementTime, setLastPlacementTime] = useState<number | null>(
    null,
  )
  const [canPlace, setCanPlace] = useState(true)

  // Hovered pixel state
  const [hoveredPixel, setHoveredPixel] = useState<PixelWithUser | null>(null)
  const [hoveredCoords, setHoveredCoords] = useState({ x: -1, y: -1 })

  // Handle pixel placement
  const handlePixelPlace = useCallback(() => {
    setLastPlacementTime(Date.now())
    setCanPlace(false)
  }, [])

  // Handle cooldown end
  const handleCooldownEnd = useCallback(() => {
    setCanPlace(true)
  }, [])

  // Handle pixel hover
  const handlePixelHover = useCallback(
    (pixel: PixelWithUser | null, x: number, y: number) => {
      setHoveredPixel(pixel)
      setHoveredCoords({ x, y })
    },
    [],
  )

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        {/* Title */}
        <h1 className="text-3xl font-bold">Zero Place</h1>

        {/* Main content area */}
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Canvas */}
          <Canvas
            selectedColor={selectedColor}
            userId={userId}
            onPixelPlace={handlePixelPlace}
            canPlace={canPlace}
            onPixelHover={handlePixelHover}
          />

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Color picker */}
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              disabled={!canPlace}
            />

            {/* Cooldown timer */}
            <CooldownTimer
              lastPlacementTime={lastPlacementTime}
              onCooldownEnd={handleCooldownEnd}
            />

            {/* Pixel info */}
            <PixelInfo
              pixel={hoveredPixel}
              x={hoveredCoords.x}
              y={hoveredCoords.y}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
