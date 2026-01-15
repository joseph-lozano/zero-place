# Zero Sync Engine

Zero is a sync engine by [Rocicorp](https://rocicorp.dev) that enables instant web applications by syncing data to the client before it's needed.

## What Problem Does Zero Solve?

| Problem            | Traditional Approach                         | Zero's Solution                                     |
| ------------------ | -------------------------------------------- | --------------------------------------------------- |
| Slow access        | Every read/write goes to server (100s of ms) | Reads/writes happen against local datastore         |
| Stale data         | API responses immediately stale              | Continuous real-time sync via WebSocket             |
| Complex caching    | Manual cache invalidation                    | Automatic normalized client-side datastore          |
| Backend complexity | Custom APIs for every data access            | Query-driven sync eliminates backend for many cases |

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Client App     │     │   Zero-Cache     │     │    Postgres      │
│  ┌────────────┐  │     │  ┌────────────┐  │     │                  │
│  │Zero Client │◄─┼─────┼─►│ SQLite     │◄─┼─────┼─► Database       │
│  │(local DB)  │  │ WS  │  │ Replica    │  │ WAL │                  │
│  └────────────┘  │     │  └────────────┘  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Key Components

1. **Zero Client** (`@rocicorp/zero`) - JavaScript library that maintains a local cache (IndexedDB) and handles optimistic updates
2. **Zero-Cache** (server) - Sits between clients and Postgres, maintains SQLite replica via WAL replication
3. **Zero Schema** (`schema.ts`) - TypeScript file describing tables, columns, and relationships
4. **ZQL** - Zero Query Language, a TypeScript query builder that runs on both client and server

## Installation

```bash
npm install @rocicorp/zero
```

## Postgres Setup

Zero requires Postgres with logical replication enabled:

```bash
docker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  postgres -c wal_level=logical
```

## Starting Zero-Cache

```bash
export ZERO_UPSTREAM_DB="postgres://postgres:password@localhost:5432/postgres"
export ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
export ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"
npx zero-cache-dev
```

## Schema Definition

### Defining Tables

```typescript
import {
  table,
  string,
  number,
  boolean,
  json,
  enumeration,
} from '@rocicorp/zero'

const pixel = table('pixel')
  .columns({
    id: string(),
    x: number(),
    y: number(),
    color: string(),
    placedBy: string(),
    placedAt: number(),
  })
  .primaryKey('id')
```

### Defining Relationships

```typescript
import { relationships } from '@rocicorp/zero'

const pixelRelationships = relationships(pixel, ({ one }) => ({
  user: one({
    sourceField: ['placedBy'],
    destField: ['id'],
    destSchema: user,
  }),
}))
```

### Creating the Schema

```typescript
import { createSchema } from '@rocicorp/zero'

export const schema = createSchema({
  tables: [user, pixel],
  relationships: [pixelRelationships],
})

export type Schema = typeof schema
```

## ZQL Queries

```typescript
import { zql } from './schema.ts'

// Basic query
zql.pixel

// Filtering
zql.pixel.where('x', 50).where('y', 50)
zql.pixel.where('color', 'IN', ['#FF0000', '#00FF00'])

// Ordering and pagination
zql.pixel.orderBy('placedAt', 'desc').limit(100)

// Single result
zql.pixel.where('id', pixelId).one()

// With relationships
zql.pixel.related('user')
```

## Defining Named Queries

```typescript
import { defineQueries, defineQuery } from '@rocicorp/zero'
import { z } from 'zod'

export const queries = defineQueries({
  pixels: {
    all: defineQuery(z.object({}), () => zql.pixel),

    byCoord: defineQuery(
      z.object({ x: z.number(), y: z.number() }),
      ({ args: { x, y } }) => zql.pixel.where('x', x).where('y', y).one(),
    ),
  },
})
```

## Client-Side Setup (React)

### Provider Setup

```tsx
import { ZeroProvider } from '@rocicorp/zero/react'
import { schema } from './zero/schema.ts'
import { mutators } from './zero/mutators.ts'

function Root() {
  return (
    <ZeroProvider
      userID={session.userID}
      cacheURL="http://localhost:4848"
      schema={schema}
      mutators={mutators}
    >
      <App />
    </ZeroProvider>
  )
}
```

### Using Queries

```tsx
import { useQuery, useZero } from '@rocicorp/zero/react'
import { queries } from './queries.ts'

function Canvas() {
  const [pixels, result] = useQuery(queries.pixels.all())

  if (result.type === 'error') {
    return <div>Error: {result.error.message}</div>
  }

  return pixels.map((pixel) => <Pixel key={pixel.id} pixel={pixel} />)
}
```

### Using Mutations

```tsx
import { useZero } from '@rocicorp/zero/react'
import { mutators } from './mutators.ts'
import { nanoid } from 'nanoid'

function Canvas() {
  const zero = useZero()

  const placePixel = (x: number, y: number, color: string) => {
    zero.mutate(
      mutators.pixels.place({
        id: nanoid(),
        x,
        y,
        color,
        placedBy: userId,
        placedAt: Date.now(),
      }),
    )
  }
}
```

## Server-Side Setup

### Defining Mutators

```typescript
import { defineMutators, defineMutator } from '@rocicorp/zero'
import { z } from 'zod'

export const mutators = defineMutators({
  pixels: {
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
        await tx.mutate.pixel.upsert(args)
      },
    ),
  },
})
```

### Query Endpoint

```typescript
// api/zero/query.ts
import { handleQueryRequest, mustGetQuery } from '@rocicorp/zero'

export async function POST(request: Request) {
  const result = await handleQueryRequest(
    (name, args) => {
      const query = mustGetQuery(queries, name)
      return query.fn({ args, ctx: { userId: 'anon' } })
    },
    schema,
    request,
  )
  return Response.json(result)
}
```

### Mutate Endpoint

```typescript
// api/zero/mutate.ts
import { handleMutateRequest, mustGetMutator } from '@rocicorp/zero'

export async function POST(request: Request) {
  const result = await handleMutateRequest(
    dbProvider,
    (transact) =>
      transact((tx, name, args) => {
        const mutator = mustGetMutator(mutators, name)
        return mutator.fn({ args, tx, ctx: { userId: 'anon' } })
      }),
    request,
  )
  return Response.json(result)
}
```

## How Sync Works

### Life of a Query

1. Query runs locally first → instant results from cache
2. Query sent to zero-cache
3. Zero-cache calls your server's `query` endpoint
4. Server returns ZQL expression
5. Zero-cache runs query against replica, sends results to client
6. Postgres changes replicate → zero-cache updates queries → clients receive updates

### Life of a Mutation

1. Mutator runs on client → optimistic update applied immediately
2. Mutation sent to server's `mutate` endpoint
3. Server runs mutator in transaction against Postgres
4. Changes replicate to zero-cache via WAL
5. Zero-cache sends row updates to clients
6. Client rolls back optimistic changes, applies server state

## Key Characteristics

- **Not truly local-first**: It's a client-server system with an authoritative server
- **Query-driven sync**: You control what syncs through queries
- **Instant UI**: Most queries resolve immediately using local data
- **Real-time updates**: Changes sync to all connected clients via WebSocket
- **Optimistic updates**: UI updates instantly, server confirms/rejects

## Resources

- **Docs**: https://zero.rocicorp.dev
- **GitHub**: https://github.com/rocicorp/mono#zero
- **Discord**: https://discord.rocicorp.dev
