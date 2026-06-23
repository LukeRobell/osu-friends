# osufriends.com — sprint plan

## Vision
A matchmaking site for osu! players. Users log in with their osu! account, we pull their skill data via osu! API v2, and match them with players at similar skill levels.

---

## Sprint 1 — Auth + profile ✅
- [x] osu! OAuth via next-auth (JWT strategy)
- [x] Fetch user data from osu! API v2 on login (rank, avatar, country, username, pp)
- [x] Save user to DB via Prisma (Supabase PostgreSQL)
- [x] /profile/[username] page — avatar, stats, preferred modes, "View osu! profile ↗" button
- [x] Global rank shown only when available (API caps at rank 10,000)
- [x] Dark theme — pink/purple accents on black

---

## Sprint 2 — Discovery feed ✅
- [x] /discover page listing players
- [x] Filter by game mode (osu! / Taiko / Catch / Mania)
- [x] Skill-level matching via **average of top-5 play pp** (±20pp range)
  - Rank-based filtering abandoned: osu! performance rankings API hard-caps at rank 10,000.
    Players like rank 34k are invisible. Switched to pp as the skill metric.
  - Avg top-5 pp chosen over account pp or single top play — better current-skill signal.
- [x] Discover shows **registered osufriends users only** (session seed removed)
  - Session seed was removed: beatmap leaderboards only surface top-50 scores per map,
    meaning only rank ~5k–50k players appeared. This created fake "strangers" in discover
    with no connection to the app. Cleaner to show only real registered members.
  - Discover batch-fetches live `is_online` + `last_visit` from `GET /users?ids[]=...`
    on every page load — green dot and "Online now" / "Xm ago" are always accurate.
- [x] Signed-in user excluded from their own discover results
- [x] pp shown on player cards and profiles ("Average play: 332pp")
- [x] Rank shown on profile only if available (API caps at rank 10,000)
- [x] Global rank added to discover player cards
- [x] "Sync account" button on own profile — refreshes pp, rank, and online status without re-login
  - Calls `GET /users/{id}` + `GET /users/{id}/scores/best?limit=5` in parallel
  - `router.refresh()` re-renders the profile page with updated DB values

---

## Sprint 3 — Live Lobbies ✅
- [x] `GET /rooms?type_group=realtime&mode=active` — fetch ALL active real-time multiplayer rooms
- [x] Filter rooms to ±1.0★ of user's skill level (derived via `ppToStars(userPp)`)
- [x] Cross-reference `recent_participants` against registered osufriends users in DB for pink-ring highlighting
- [x] Sort rooms by participant account pp proximity to current user's account pp
  - Batch-fetches participant account pp via `GET /users?ids[]=...` for star-filtered rooms only
  - Also fetches current user's account pp for apples-to-apples comparison
  - Falls back to star-proximity sort if API doesn't return participant statistics
- [x] Beatmap cover shown as card background strip with star rating
- [x] Osufriends member avatars shown with pink ring; "X friends here" label if any
- [x] "View →" links to `osu.ppy.sh/multiplayer/rooms/{id}`
- [x] **"Ask to join" button** — sends a pre-written DM to the room host via osu! chat API
  - Uses `chat.write` OAuth scope (stored in JWT at sign-in)
  - `POST /chat/new` with user's OAuth token — DM arrives in-game and on osu! website
  - No page navigation; button shows Sending → Sent! / Failed inline
- [x] Streams in via Suspense — doesn't delay the main player grid
- [x] 30-second server-side cache on rooms API call; participant pp cached 30s; online status cached 60s

---

## Sprint 4 — osu! Friends integration (next)
Goal: surface the real osu! social graph rather than building a parallel one. Users connect on osu! itself; osufriends just reflects and enhances that.

- [ ] Add `friends.read` to OAuth scope (`identify public chat.write friends.read`) — one-time re-auth
- [ ] `GET /friends` using user's OAuth access token → returns their full osu! friends list
- [ ] **Discover**: show "osu! friend" badge on cards for users already in your osu! friends list
- [ ] **Own profile — "Your osu! friends on osufriends" section**:
  - Cross-reference osu! friends list against registered osufriends users in DB
  - Show friend cards: avatar, username, pp, rank, online status
  - Cross-reference friends' osuIds against active room `recent_participants`
  - If a friend is in a lobby: show room name + "Ask to join" DM button
    - DM goes to the **friend** (not the room host): "Hey! I see you're in [room] — mind if I hop in?"
  - If a friend is not in a lobby: no DM button (they can already talk in-game as osu! friends)
  - Note: `recent_participants` is best-effort — covers recently active players in a room, not guaranteed complete roster

---

## Sprint 5 — Polish + deploy
- [ ] Deploy to Vercel
- [ ] Point osufriends.com domain
- [ ] Rotate osu! client secret (was briefly exposed in a screenshot during development)

---

## osu! API usage policy compliance

Per osu!'s guidelines: gather on login, poll registered users at irregular intervals, cache aggressively, don't re-request data you already have, stay under 60 req/min.

| Endpoint | When called | Cache | Notes |
|----------|-------------|-------|-------|
| `POST /oauth/token` (client credentials) | On cold start / token expiry | In-memory until expiry | Single token shared server-wide |
| `GET /me` | On sign-in only | n/a (next-auth handles) | ✅ One-time per session |
| `GET /users/{id}/scores/best?limit=5` | Sign-in + sync button | `no-store` | ✅ User-triggered only |
| `GET /users/{id}` | Sign-in, sync button, lobby sort | `no-store` for sync; 5-min cache for lobby | ✅ User-triggered or cached |
| `GET /users?ids[]=...` (online status) | Discover page load | 60s revalidate | ✅ Shared cache across concurrent users |
| `GET /rooms?type_group=realtime` | Discover page load | 30s revalidate | ✅ Shared cache |
| `GET /users?ids[]=...` (participant pp) | Discover page load, filtered rooms only | 30s revalidate | ✅ Shared cache, filtered subset |
| `POST /chat/new` | "Ask to join" button click | n/a | ✅ Explicit user action only |

Worst-case per discover page load (cache cold): ~5 API calls. Next.js shared revalidate cache means concurrent users share responses for identical URLs — actual rate stays very low.

---

## osu! API notes
- Base URL: `https://osu.ppy.sh/api/v2`
- Auth: client credentials (public data) + authorization code (user OAuth for `chat.write`)
- Performance rankings: **hard-capped at 200 pages = 10,000 players per mode**
- Beatmapsets search supports `q=stars>=X stars<=Y` syntax for difficulty filtering
- Beatmap leaderboards: top 50 scores only — no pagination, no lower-score access
- No webhooks or push events — all data is pull-only
- `osu://mp/{id}` protocol does NOT work for lazer multiplayer rooms (only covers beatmaps, downloads, spectating, editor)
- `POST /chat/new` requires `chat.write` scope; returns `{ channel, message }` on success

## Tech stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Supabase) · next-auth · Vercel
