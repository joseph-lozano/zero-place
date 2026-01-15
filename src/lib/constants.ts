// Canvas configuration
export const CANVAS_WIDTH = Number(process.env.CANVAS_WIDTH) || 100
export const CANVAS_HEIGHT = Number(process.env.CANVAS_HEIGHT) || 100

// Cooldown in milliseconds (default 15 seconds)
export const PIXEL_COOLDOWN_MS = Number(process.env.PIXEL_COOLDOWN_MS) || 15000

// Classic r/place 16-color palette
export const COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#E4E4E4', name: 'Light Gray' },
  { hex: '#888888', name: 'Gray' },
  { hex: '#222222', name: 'Black' },
  { hex: '#FFA7D1', name: 'Pink' },
  { hex: '#E50000', name: 'Red' },
  { hex: '#E59500', name: 'Orange' },
  { hex: '#A06A42', name: 'Brown' },
  { hex: '#E5D900', name: 'Yellow' },
  { hex: '#94E044', name: 'Lime' },
  { hex: '#02BE01', name: 'Green' },
  { hex: '#00D3DD', name: 'Cyan' },
  { hex: '#0083C7', name: 'Blue' },
  { hex: '#0000EA', name: 'Dark Blue' },
  { hex: '#CF6EE4', name: 'Purple' },
  { hex: '#820080', name: 'Dark Purple' },
] as const

export type ColorHex = (typeof COLORS)[number]['hex']
