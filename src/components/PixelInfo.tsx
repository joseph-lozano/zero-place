import { COLORS } from '@/lib/constants'
import type { Pixel, User } from '@/zero/schema'
import { Clock, User as UserIcon, Palette, MapPin } from 'lucide-react'

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
      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-center text-sm text-slate-500">
        <MapPin size={24} className="mb-2 opacity-50" />
        <p>
          Hover over a pixel
          <br />
          to see details
        </p>
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
    <div className="flex flex-col gap-3 rounded-lg bg-white/5 p-4 text-sm">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={14} />
          <span>Position</span>
        </div>
        <span className="font-mono font-medium text-white">
          ({x}, {y})
        </span>
      </div>

      {pixel ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Palette size={14} />
              <span>Color</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full border border-white/10"
                style={{ backgroundColor: pixel.color }}
              />
              <span className="font-medium text-white">{colorName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={14} />
              <span>Placed</span>
            </div>
            <span className="font-medium text-white">
              {formatTime(pixel.placedAt)}
            </span>
          </div>

          {pixel.user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <UserIcon size={14} />
                <span>By</span>
              </div>
              <span
                className="max-w-[120px] truncate font-medium text-white"
                title={pixel.user.name || pixel.user.email}
              >
                {pixel.user.name || pixel.user.email}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="py-4 text-center text-slate-500">Empty pixel</div>
      )}
    </div>
  )
}
