import { defineQueries, defineQuery } from '@rocicorp/zero'
import { z } from 'zod'
import { zql } from './schema'

export const queries = defineQueries({
  pixels: {
    // Get all pixels for canvas rendering
    all: defineQuery(() => zql.pixel.related('user')),

    // Get a single pixel by coordinates
    byCoord: defineQuery(
      z.object({ x: z.number(), y: z.number() }),
      ({ args: { x, y } }) =>
        zql.pixel.where('x', x).where('y', y).related('user').one(),
    ),
  },
})
