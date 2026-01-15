import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

// =============================================================================
// Better Auth Tables
// =============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// =============================================================================
// App Tables
// =============================================================================

export const pixel = pgTable('pixel', {
  id: text('id').primaryKey(), // Format: "{x}_{y}"
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  color: text('color').notNull(), // Hex color e.g. "#FF0000"
  placedBy: text('placed_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  placedAt: timestamp('placed_at').notNull().defaultNow(),
})

export const pixelHistory = pgTable('pixel_history', {
  id: text('id').primaryKey(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  color: text('color').notNull(),
  placedBy: text('placed_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  placedAt: timestamp('placed_at').notNull().defaultNow(),
})
