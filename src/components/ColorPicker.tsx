import { COLORS, type ColorHex } from '@/lib/constants'

interface ColorPickerProps {
  selectedColor: ColorHex
  onColorSelect: (color: ColorHex) => void
}

export function ColorPicker({
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Palette
        </span>
        <div className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-slate-300">
            {COLORS.find((c) => c.hex === selectedColor)?.name ?? selectedColor}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            onClick={() => onColorSelect(hex)}
            className={`group relative h-8 w-full rounded-md shadow-sm transition-all hover:scale-105 active:scale-95 ${
              selectedColor === hex
                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                : 'hover:ring-1 hover:ring-white/50'
            }`}
            style={{ backgroundColor: hex }}
            title={name}
            aria-label={name}
          >
            {selectedColor === hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span>Ready to place!</span>
      </div>
    </div>
  )
}
