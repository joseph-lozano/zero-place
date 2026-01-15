import { defineMutator, defineMutators } from '@rocicorp/zero'
import { z } from 'zod'

export const mutators = defineMutators({
  pixel: {
    place: defineMutator(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        color: z.string(),
        placedBy: z.string(),
        placedAt: z.number(),
      }),
      async ({ tx, args }) => {
        // Upsert the pixel - this will insert if new or update if exists
        await tx.mutate.pixel.upsert(args)
      },
    ),
  },
})
