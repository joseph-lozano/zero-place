import {
  table,
  string,
  number,
  createSchema,
  createBuilder,
  relationships,
  Row,
} from '@rocicorp/zero'

// =============================================================================
// User table (subset of Better Auth user table needed for display)
// =============================================================================

const user = table('user')
  .columns({
    id: string(),
    name: string(),
    email: string(),
  })
  .primaryKey('id')

// =============================================================================
// Pixel table (current canvas state)
// =============================================================================

const pixel = table('pixel')
  .columns({
    id: string(), // Format: "{x}_{y}"
    x: number(),
    y: number(),
    color: string(), // Hex color e.g. "#FF0000"
    placedBy: string().from('placed_by'), // FK to user.id
    placedAt: number().from('placed_at'), // Unix timestamp
  })
  .primaryKey('id')

// =============================================================================
// Relationships
// =============================================================================

const pixelRelationships = relationships(pixel, ({ one }) => ({
  user: one({
    sourceField: ['placedBy'],
    destField: ['id'],
    destSchema: user,
  }),
}))

// =============================================================================
// Schema
// =============================================================================

export const schema = createSchema({
  tables: [user, pixel],
  relationships: [pixelRelationships],
})

export const zql = createBuilder(schema)

export type Schema = typeof schema
export type Pixel = Row<typeof schema.tables.pixel>
export type User = Row<typeof schema.tables.user>

export type AuthData = {
  userID: string | null
}

declare module '@rocicorp/zero' {
  interface DefaultTypes {
    schema: Schema
    context: AuthData
  }
}
