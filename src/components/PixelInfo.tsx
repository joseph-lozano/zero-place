import { COLORS } from '@/lib/constants'
import type { Pixel, User } from '@/zero/schema'

// Pixel with optional user relation from the query
type PixelWithUser = Pixel & { user?: User | null }

interface PixelInfoProps {
  pixel: PixelWithUser | null
  x: number
  y: number
}

export function PixelInfo({ pixel, x, y }: PixelInfoProps) {
  if (x < 0 || y < 0) {
    return (
      <div className="h-20 text-sm text-gray-500">
        Hover over a pixel to see info
      </div>
    )
  }

  const colorName =
    COLORS.find((c) => c.hex === pixel?.color)?.name ?? pixel?.color ?? 'Empty'

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return `${diffSecs}s ago`
  }

  return (
    <div className="h-20 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Position:</span>
        <span className="font-mono text-white">
          ({x}, {y})
        </span>
      </div>
      {pixel ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Color:</span>
            <div
              className="h-3 w-3 rounded border border-gray-600"
              style={{ backgroundColor: pixel.color }}
            />
            <span className="text-white">{colorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Placed:</span>
            <span className="text-white">{formatTime(pixel.placedAt)}</span>
          </div>
          {pixel.user && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">By:</span>
              <span className="truncate text-white">
                {pixel.user.name || pixel.user.email}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-500">Empty pixel</div>
      )}
    </div>
  )
}
