# Zero Place - Implementation Roadmap

A real-time collaborative pixel canvas (r/place clone) built with TanStack Start and Zero.

## Project Overview

- **Canvas Size**: 100x100 pixels
- **Color Palette**: 16 colors (classic r/place palette)
- **Cooldown**: 1 pixel every 15 seconds (configurable via `PIXEL_COOLDOWN_MS` env var)
- **Auth**: Better Auth with Email OTP (hardcoded to `424242` in development)
- **Sync**: Zero for real-time pixel updates across all clients
- **History**: Basic history tracking (who placed each pixel and when)

## Color Palette (16 Colors)

```
#FFFFFF - White       #E4E4E4 - Light Gray
#888888 - Gray        #222222 - Black
#FFA7D1 - Pink        #E50000 - Red
#E59500 - Orange      #A06A42 - Brown
#E5D900 - Yellow      #94E044 - Lime
#02BE01 - Green       #00D3DD - Cyan
#0083C7 - Blue        #0000EA - Dark Blue
#CF6EE4 - Purple      #820080 - Dark Purple
```

---

## Phase 1: Project Setup & Auth

### 1.1 Install Dependencies

```bash
bun add @rocicorp/zero better-auth nanoid zod
bun add -D drizzle-zero
```

### 1.2 Database Schema

Create auth tables (Better Auth) and app tables:

**Auth Tables** (via Better Auth CLI):

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts (not used, but required)
- `verification` - OTP storage

**App Tables**:

- `pixel` - Canvas pixel state
  - `id` (string, PK) - Format: `{x}_{y}`
  - `x` (integer)
  - `y` (integer)
  - `color` (string) - Hex color
  - `placed_by` (string, FK → user.id)
  - `placed_at` (timestamp)

- `pixel_history` - Historical record of all placements
  - `id` (string, PK)
  - `x` (integer)
  - `y` (integer)
  - `color` (string)
  - `placed_by` (string, FK → user.id)
  - `placed_at` (timestamp)

### 1.3 Better Auth Setup

**Server** (`src/lib/auth.ts`):

- Configure Better Auth with Drizzle adapter
- Add Email OTP plugin with hardcoded `424242` in dev
- Add `tanstackStartCookies()` plugin

**Client** (`src/lib/auth-client.ts`):

- Create auth client with `emailOTPClient()` plugin
- Export `useSession`, `signIn`, `signOut`

**API Route** (`src/routes/api/auth/$.ts`):

- Mount Better Auth handler for all `/api/auth/*` routes

### 1.4 Auth UI

- `/login` route with email input → OTP input flow
- Session display in header
- Protected canvas route (redirect to login if not authenticated)

---

## Phase 2: Zero Setup

### 2.1 Zero Schema

Create `src/zero/schema.ts`:

- Define `pixel` table matching Drizzle schema
- Define `user` table (subset needed for display)
- Create relationships (pixel → user)

### 2.2 Zero Queries

Create `src/zero/queries.ts`:

- `pixels.all` - Get all pixels (for canvas render)
- `pixels.byCoord` - Get single pixel by x,y

### 2.3 Zero Mutators

Create `src/zero/mutators.ts`:

- `pixels.place` - Place a pixel (with cooldown validation on server)

### 2.4 Zero Server Endpoints

**Query endpoint** (`src/routes/api/zero/query.ts`):

- Handle Zero query requests
- Validate user session

**Mutate endpoint** (`src/routes/api/zero/mutate.ts`):

- Handle Zero mutations
- Enforce cooldown (15 seconds between placements)
- Record to `pixel_history` table

### 2.5 Zero Provider Setup

Update root layout:

- Wrap app in `ZeroProvider`
- Pass user ID from session
- Configure cache URL

---

## Phase 3: Canvas Implementation

### 3.1 Canvas Component

`src/components/Canvas.tsx`:

- Render 100x100 grid using `useQuery(queries.pixels.all())`
- Each pixel is a clickable cell
- Show color on hover
- Handle click → open color picker or place pixel

### 3.2 Color Picker

`src/components/ColorPicker.tsx`:

- Display 16 color palette
- Currently selected color highlighted
- Click to select color

### 3.3 Pixel Placement

- On canvas click: call `zero.mutate(mutators.pixels.place(...))`
- Optimistic update shows immediately
- Server validates cooldown
- If rejected, UI reverts automatically

### 3.4 Cooldown Timer

`src/components/CooldownTimer.tsx`:

- Show countdown until next pixel can be placed
- Disable canvas interaction during cooldown
- Store last placement time in local state (or query from server)

---

## Phase 4: User Experience

### 4.1 Zoom & Pan

- Allow zooming in/out of canvas
- Pan to navigate large canvas
- Show coordinates on hover

### 4.2 Pixel Info

- Hover/click pixel to see:
  - Who placed it
  - When it was placed
  - Color name

### 4.3 User Stats

- Show user's total pixels placed
- Show time until next placement

---

## Phase 5: Polish & Deploy

### 5.1 Performance

- Virtualize canvas rendering for large canvases
- Optimize Zero queries
- Add loading states

### 5.2 Error Handling

- Handle Zero connection errors
- Handle auth errors
- Show user-friendly error messages

### 5.3 Environment Variables

```env
# Database
DATABASE_URL=postgres://...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Zero
ZERO_UPSTREAM_DB=postgres://...
ZERO_CACHE_URL=http://localhost:4848

# App Config
PIXEL_COOLDOWN_MS=15000  # 15 seconds
CANVAS_WIDTH=100
CANVAS_HEIGHT=100
```

### 5.4 Deployment

- Deploy Postgres (Neon, Supabase, etc.)
- Deploy Zero-Cache (self-hosted or Rocicorp cloud)
- Deploy TanStack Start app (Vercel, Railway, etc.)

---

## File Structure

```
src/
├── components/
│   ├── Canvas.tsx
│   ├── ColorPicker.tsx
│   ├── CooldownTimer.tsx
│   ├── Header.tsx
│   ├── LoginForm.tsx
│   └── PixelInfo.tsx
├── db/
│   ├── index.ts
│   └── schema.ts          # Drizzle schema (auth + app tables)
├── lib/
│   ├── auth.ts            # Better Auth server config
│   ├── auth-client.ts     # Better Auth client
│   └── constants.ts       # Color palette, canvas size
├── routes/
│   ├── __root.tsx
│   ├── index.tsx          # Canvas page (protected)
│   ├── login.tsx          # Login page
│   └── api/
│       ├── auth/
│       │   └── $.ts       # Better Auth handler
│       └── zero/
│           ├── query.ts   # Zero query endpoint
│           └── mutate.ts  # Zero mutate endpoint
├── zero/
│   ├── schema.ts          # Zero schema
│   ├── queries.ts         # Zero queries
│   └── mutators.ts        # Zero mutators
├── router.tsx
└── styles.css
```

---

## Task Checklist

### Phase 1: Auth

- [x] Install dependencies
- [x] Create Drizzle schema for auth tables
- [x] Create Drizzle schema for pixel/pixel_history tables
- [x] Run migrations
- [x] Set up Better Auth server config
- [x] Set up Better Auth client
- [x] Create auth API route
- [x] Create login page with OTP flow
- [x] Add session to header

### Phase 2: Zero

- [x] Create Zero schema
- [x] Create Zero queries
- [x] Create Zero mutators
- [x] Create Zero query endpoint
- [x] Create Zero mutate endpoint (with cooldown)
- [x] Set up ZeroProvider in root

### Phase 3: Canvas

- [ ] Create Canvas component
- [ ] Create ColorPicker component
- [ ] Implement pixel placement
- [ ] Create CooldownTimer component
- [ ] Wire up real-time sync

### Phase 4: Polish

- [ ] Add zoom/pan
- [ ] Add pixel info on hover
- [ ] Add user stats
- [ ] Error handling
- [ ] Loading states

---

## Key Decisions

1. **Pixel ID format**: `{x}_{y}` for easy lookup and upsert
2. **Cooldown enforcement**: Server-side only (client shows timer but server is authoritative)
3. **History storage**: Separate table, not queried by Zero (reduces sync payload)
4. **Canvas rendering**: CSS Grid or Canvas API (TBD based on performance)
5. **Session-based identity**: Users identified by Better Auth session, no anonymous access
