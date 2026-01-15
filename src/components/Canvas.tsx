import { useCallback, useState, useRef } from 'react'
import { useQuery, useZero } from '@rocicorp/zero/react'
import { queries } from '@/zero/queries'
import { mutators } from '@/zero/mutators'
import { CANVAS_WIDTH, CANVAS_HEIGHT, type ColorHex } from '@/lib/constants'
import type { Pixel, User } from '@/zero/schema'

// Pixel with optional user relation from the query
type PixelWithUser = Pixel & { user?: User | null }

interface CanvasProps {
  selectedColor: ColorHex
  userId: string
  onPixelHover?: (pixel: PixelWithUser | null, x: number, y: number) => void
}

const PIXEL_SIZE = 8 // Base pixel size in CSS pixels
const MIN_ZOOM = 0.5
const MAX_ZOOM = 4

export function Canvas({ selectedColor, userId, onPixelHover }: CanvasProps) {
  const zero = useZero()
  const [pixels] = useQuery(queries.pixels.all())

  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Create a map for fast pixel lookup
  const pixelMap = new Map<string, PixelWithUser>()
  for (const pixel of pixels) {
    pixelMap.set(`${pixel.x}_${pixel.y}`, pixel as PixelWithUser)
  }

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      const pixelId = `${x}_${y}`

      zero.mutate(
        mutators.pixel.place({
          id: pixelId,
          x,
          y,
          color: selectedColor,
          placedBy: userId,
          placedAt: Date.now(),
        }),
      )
    },
    [zero, selectedColor, userId],
  )

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 2 || e.shiftKey) {
        // Middle click, right click, or shift+click to pan
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        })
      }
    },
    [isPanning, panStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
    onPixelHover?.(null, -1, -1)
  }, [onPixelHover])

  // Handle context menu (prevent default to allow right-click pan)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Calculate scaled pixel size
  const scaledPixelSize = PIXEL_SIZE * zoom

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Controls */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
          className="rounded bg-gray-700 px-2 py-1 hover:bg-gray-600"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z * 0.8))}
          className="rounded bg-gray-700 px-2 py-1 hover:bg-gray-600"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="rounded bg-gray-700 px-2 py-1 hover:bg-gray-600"
        >
          Reset
        </button>
        <span className="text-xs">(Scroll to zoom, Shift+drag to pan)</span>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
        style={{
          width: Math.min(
            CANVAS_WIDTH * PIXEL_SIZE + 4,
            window.innerWidth - 40,
          ),
          height: Math.min(
            CANVAS_HEIGHT * PIXEL_SIZE + 4,
            window.innerHeight - 300,
          ),
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        <div
          className="relative"
          style={{
            width: CANVAS_WIDTH * scaledPixelSize,
            height: CANVAS_HEIGHT * scaledPixelSize,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            cursor: isPanning ? 'grabbing' : 'crosshair',
          }}
        >
          {/* Render grid */}
          {Array.from({ length: CANVAS_HEIGHT }, (_, y) =>
            Array.from({ length: CANVAS_WIDTH }, (_, x) => {
              const pixel = pixelMap.get(`${x}_${y}`)
              const bgColor = pixel?.color ?? '#1f2937' // Default dark gray

              return (
                <div
                  key={`${x}_${y}`}
                  className="absolute box-border border-[0.5px] border-gray-700/30 transition-transform hover:z-10 hover:scale-125 hover:border-white"
                  style={{
                    left: x * scaledPixelSize,
                    top: y * scaledPixelSize,
                    width: scaledPixelSize,
                    height: scaledPixelSize,
                    backgroundColor: bgColor,
                  }}
                  onClick={() => handlePixelClick(x, y)}
                  onMouseEnter={() => onPixelHover?.(pixel ?? null, x, y)}
                  title={`(${x}, ${y})`}
                />
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
