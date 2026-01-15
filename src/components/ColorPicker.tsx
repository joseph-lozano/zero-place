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
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-400">Select Color</span>
      <div className="grid grid-cols-8 gap-1">
        {COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            onClick={() => onColorSelect(hex)}
            className={`h-8 w-8 rounded border-2 transition-transform hover:scale-110 ${
              selectedColor === hex
                ? 'border-white shadow-lg shadow-white/20'
                : 'border-transparent'
            } cursor-pointer`}
            style={{ backgroundColor: hex }}
            title={name}
            aria-label={name}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div
          className="h-4 w-4 rounded border border-gray-600"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-gray-300">
          {COLORS.find((c) => c.hex === selectedColor)?.name ?? selectedColor}
        </span>
      </div>
    </div>
  )
}
