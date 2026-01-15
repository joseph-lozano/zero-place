import { useEffect, useState } from 'react'
import { PIXEL_COOLDOWN_MS } from '@/lib/constants'

interface CooldownTimerProps {
  lastPlacementTime: number | null
  onCooldownEnd: () => void
}

export function CooldownTimer({
  lastPlacementTime,
  onCooldownEnd,
}: CooldownTimerProps) {
  const [remainingMs, setRemainingMs] = useState(0)

  useEffect(() => {
    if (lastPlacementTime === null) {
      setRemainingMs(0)
      return
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - lastPlacementTime
      const remaining = Math.max(0, PIXEL_COOLDOWN_MS - elapsed)
      setRemainingMs(remaining)

      if (remaining === 0) {
        onCooldownEnd()
      }
    }

    // Update immediately
    updateRemaining()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateRemaining, 100)

    return () => clearInterval(interval)
  }, [lastPlacementTime, onCooldownEnd])

  if (remainingMs === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <div className="h-3 w-3 animate-pulse rounded-full bg-green-400" />
        <span>Ready to place!</span>
      </div>
    )
  }

  const seconds = Math.ceil(remainingMs / 1000)
  const progress = ((PIXEL_COOLDOWN_MS - remainingMs) / PIXEL_COOLDOWN_MS) * 100

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-yellow-400">
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <span>Cooldown: {seconds}s</span>
      </div>
      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full bg-yellow-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
