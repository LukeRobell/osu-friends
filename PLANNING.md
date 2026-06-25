# osufriends.com — sprint plan

## Vision
A matchmaking site for osu! players. Users log in with their osu! account, we pull their skill data via osu! API v2, and match them with players at similar skill levels. Beyond discovery, the site creates active engagement: daily 4v4 tournaments, a rival system with bot notifications, and live tournament tracking.

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
  - Session seed removed: beatmap leaderboards only surface top-50 scores per map,
    meaning only rank ~5k–50k players appeared. Cleaner to show only real registered members.
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
- [x] Beatmap cover shown as card background strip with star rating
- [x] osufriends member avatars shown with pink ring; "X friends here" label if any
- [x] "View →" links to `osu.ppy.sh/multiplayer/rooms/{id}`
- [x] **"Ask to join" button** — sends a pre-written DM to the room host via osu! chat API
  - Uses bot token (Luke's personal account) via `POST /chat/new`
  - DM format: `"[username] from osu!friends wants to join your lobby '[room]'! /invite [username]"`
  - `/invite [username]` is clickable in osu! chat — host can invite in one step
  - If bot token unavailable → yellow "DM unavailable" message
  - If osu! API rejects → opens `osu.ppy.sh/home/messages/users/{id}` popup (fallback)
- [x] Streams in via Suspense — doesn't delay the main player grid
- [x] 30-second server-side cache on rooms API; participant pp cached 30s; online status cached 60s

---

## Sprint 4 — osu! Friends integration ✅
Goal: surface the real osu! social graph rather than building a parallel one.

- [x] Add `friends.read` to OAuth scope — one-time re-auth
- [x] `GET /friends` using user's OAuth access token → returns their full osu! friends list
- [x] **Discover**: show "osu! friend" badge (cyan) on cards for users already in your osu! friends list
- [x] **Own profile — "osu! friends on osu!friends" section**:
  - Cross-reference osu! friends list against registered osufriends users in DB
  - Show friend cards: avatar, username, pp, rank — click avatar/name opens profile popup
  - Cross-reference friends' osuIds against active room `recent_participants`
  - If a friend is in a lobby: show room name + "Ask to join" DM button
  - If a friend is not in a lobby: no DM button

---

## Sprint 5 — Polish + deploy ✅
- [x] Rotate osu! client secret (was briefly exposed in a screenshot during development)
- [x] Deploy to Vercel (Pro plan — required for Cron Jobs)
- [x] Point osufriends.com domain to Vercel
- [x] Update osu! OAuth app redirect URI from localhost to https://osufriends.com

---

## Sprint 6 — Tournaments + Profile + Rivals ✅

### Phase 1 — Tournament Matchmaking ✅

**Bot token infrastructure**
- [x] `BotToken` Prisma model — stores access + refresh token with expiry as DB singleton
- [x] `lib/bot-token.ts` — `getBotToken()` reads from DB, auto-refreshes before expiry
- [x] `/api/bot/authorize` — owner-only route (protected by `OSU_OWNER_ID`) initiates OAuth with `chat.write`
- [x] `/api/bot/callback` — exchanges code, stores token; no manual rotation needed ever

**User opt-in**
- [x] `tournamentOptIn` boolean on User model (default false)
- [x] "Tournaments" toggle on own profile: "Get matched with 7 players at your level for a 4v4 tournament today."
- [x] Timezone derived from majority country code of accepted participants (IANA mapping, US defaults to EST)

**Database models**
- [x] `Tournament`: id, status (PENDING_VOTES | SCHEDULED | IN_PROGRESS | CANCELLED | COMPLETED), gameMode, scheduledFor, reminderSent, createdAt
- [x] `TournamentParticipant`: tournamentId, userId, status (INVITED | ACCEPTED | DECLINED), availability

**Matchmaking cron** (`/api/cron/matchmake` — runs 4x daily at 10, 14, 18, 22 UTC)
- [x] Groups opt-in users by ±15% pp using sliding window algorithm
- [x] Creates 4v4 tournaments (groups of 8), marks users as used to prevent double-invite
- [x] DMs each participant: "osu!friends found a 4v4 group at your level! Ready to play? [link]"

**Voting + scheduling**
- [x] `/tournament/[id]` page: participant grid, vote tally, status badges
- [x] "Right now" (green) and "Tonight" (gray) vote buttons
- [x] When 6+ players accept: majority country → IANA timezone → 8pm local → UTC; tournament locks as SCHEDULED
- [x] DMs participants: "Your match is set for tonight at 8pm EST! [link]"
- [x] "Start match" button when SCHEDULED + accepted; sets status to IN_PROGRESS

**30-min reminder cron** (`/api/cron/remind` — runs every 10 min)
- [x] Finds SCHEDULED tournaments with scheduledFor in 25–35 min window, reminderSent = false
- [x] DMs all ACCEPTED participants: "Your osu!friends match starts in 30 minutes!"
- [x] Sets reminderSent = true to prevent repeat

**Live tournaments on Discover**
- [x] `LiveTournaments` server component above Live Lobbies on /discover
- [x] Shows IN_PROGRESS tournaments from last 3 hours
- [x] If 2+ teams of 4+ share an osu! Team → shows "Team Name [TAG] vs Team Name [TAG]" with team flags
- [x] Otherwise shows top 4 vs bottom 4 player avatars
- [x] Pink pulse dot, "View →" link to tournament page

---

### Phase 2 — Profile Redesign ✅

**Country rank**
- [x] `countryRank Int?` added to User model
- [x] `statistics.country_rank` fetched from osu! API on sync
- [x] Profile shows 3-card grid: Global Rank (pink) | Country Rank (purple, with flag) | Average Play (white)

**Country flag**
- [x] osu!'s own SVG flags: `https://osu.ppy.sh/assets/images/flags/{unicode-codepoints}.svg`
- [x] `countryFlagUrl(code)` helper converts "US" → "1f1fa-1f1f8" → SVG URL
- [x] Shown on profile header, Country Rank card, profile modal, rival section

**osu! Teams integration**
- [x] `teamId`, `teamName`, `teamTag`, `teamFlagUrl` added to User model
- [x] Team data fetched from `GET /users/{id}` (team is nested on the user object)
- [x] Team flag URL fetched separately: `GET /api/v2/teams/{teamId}` (content-addressed, can't be guessed)
- [x] `TeamBadge` component: team flag image (20×14px) + team name, links to osu! team page
- [x] Shown on profile header and in profile popup modals
- [x] Teams displayed in Live Tournaments for team-vs-team format

**Profile popup modal**
- [x] Clicking any user card (Discover, osu! friends list) opens `ProfileModal` overlay
- [x] Shows: avatar, online dot, username, country flag, team badge, 3-stat grid, preferred modes
- [x] "View profile" → full profile page; "osu! profile ↗" → osu! website
- [x] ESC + backdrop click to close; body scroll locked while open
- [x] Also shows Rival button (see below)
- [x] Profile page: clicking non-own profile shows RivalButton below username

---

### Phase 3 — Rival System ✅

**Data model**
- [x] `rivalId String?` self-relation on User (one rival per account, mutual when accepted)
- [x] `RivalRequest` model: fromUserId, toUserId, status (PENDING | ACCEPTED | DECLINED)
- [x] `RivalNotifiedPlay` model: userId + osuScoreId (tracks which rival plays have triggered notifications)
- [x] `Notification` model: userId, type (RIVAL_REQUEST | RIVAL_PLAY | TOURNAMENT_INVITE), title, body, link, read

**Rival requests**
- [x] `POST /api/rival/request` — send challenge (blocked if you already have a rival)
- [x] `POST /api/rival/request/[id]/accept` — sets both users' rivalId to each other; notifies challenger
- [x] `POST /api/rival/request/[id]/decline`
- [x] `POST /api/rival/remove` — clears rivalId on both sides
- [x] `GET /api/rival/status?targetOsuId=xxx` — returns current relationship state for RivalButton

**RivalButton** (client component, shown in profile modal + profile page)
- [x] States: loading → none / pending_sent / pending_received / rivals / have_rival
- [x] "Challenge as Rival" → "Challenge sent..." → accept/decline buttons → "Your Rival ⚔️ | Remove"

**Your Rival section** (own profile page)
- [x] Shows rival's avatar, online status, country flag, global rank, pp average
- [x] Fetches rival's top 50 plays from osu! API (5-min cache), filters to ≥75% of their avg pp
- [x] Displays 3 most recent significant plays: map title, difficulty, pp, relative time — each links to beatmap
- [x] Pending incoming rival challenge shown as card with Accept button even before a rival is set
- [x] "Remove rival" button with confirm dialog

**Rival play cron** (`/api/cron/rival-check` — runs every 30 min)
- [x] Checks all users who have a rival set
- [x] Fetches rival's top 50 plays; filters to ≥75% of avg pp AND created within last 48h
- [x] Skips plays already recorded in `RivalNotifiedPlay`
- [x] Creates in-app `Notification` record
- [x] Sends bot DM: "Your rival {username} just set a {pp}pp play on {title} [{version}]!\nWant to snipe their score?\n{beatmapUrl}"
- [x] Records play in `RivalNotifiedPlay` to prevent repeat DMs

---

### Phase 4 — Notification Bell ✅
- [x] `NotificationBell` in NavBar (only shown when logged in)
- [x] Polls `GET /api/notifications` every 30s; shows pink badge with unread count (capped at 9+)
- [x] Dropdown on click: icon + title + body + relative time per notification
  - ⚔️ Rival play — links to beatmap on osu! website
  - 🤺 Rival request — links to challenger's profile
  - 🏆 Tournament invite — links to tournament page
- [x] Opens dropdown → `POST /api/notifications/read` marks all read immediately
- [x] Click notification link → closes dropdown + navigates

---

## osu! API usage policy compliance

| Endpoint | When called | Cache | Notes |
|----------|-------------|-------|-------|
| `POST /oauth/token` (client credentials) | Cold start / token expiry | In-memory until expiry | Single token shared server-wide |
| `GET /me` | On sign-in only | n/a (next-auth) | One-time per session |
| `GET /users/{id}/scores/best?limit=5` | Sign-in + sync button | `no-store` | User-triggered only |
| `GET /users/{id}/scores/best?limit=50` | Rival section page load | 5-min revalidate | Cached; filtered to significant plays |
| `GET /users/{id}/scores/best?limit=50` | Rival-check cron | `no-store` | Fresh data needed for new play detection |
| `GET /users/{id}` | Sign-in, sync button | `no-store` | User-triggered |
| `GET /users?ids[]=...` (online status) | Discover page load | 60s revalidate | Shared cache across concurrent users |
| `GET /rooms?type_group=realtime` | Discover page load | 30s revalidate | Shared cache |
| `GET /users?ids[]=...` (participant pp) | Discover page load, filtered rooms only | 30s revalidate | Filtered subset |
| `GET /teams/{id}` | Sync button (if user is in a team) | `no-store` | Needed for content-addressed flag URL |
| `POST /chat/new` | "Ask to join" click / cron DMs | n/a | Bot token; user-initiated or opt-in only |

---

## osu! API notes
- Base URL: `https://osu.ppy.sh/api/v2`
- Auth: client credentials (public data) + authorization code (user OAuth for `chat.write`)
- Performance rankings: **hard-capped at 200 pages = 10,000 players per mode**
- `statistics.country_rank` available on `GET /users/{id}` — not capped like global rank
- osu! Teams (Feb 2025): team nested on user object as `team { id, name, short_name, avatar_url }`; flag URL requires separate `GET /teams/{id}` call
- Country flags: `https://osu.ppy.sh/assets/images/flags/{unicode-codepoints}.svg` (e.g. `1f1fa-1f1f8.svg` for US)
- Chat DMs: `POST /chat/new` requires `chat.write` scope; osu! does NOT support emoji in DMs
- Best plays: sorted by pp desc by default; `created_at` field available for recency sorting
- No webhooks or push events — all data is pull-only
- `osu://mp/{id}` protocol does NOT work for lazer multiplayer rooms

## osu! bot constraints
- **Cannot register a bot account** — multi-accounting is bannable
- **Currently runs on Luke's personal account** — `chat.write` works for the OAuth app owner
- **Apply to osu! account support** for official bot when ~50+ opt-in users
- **Bot rate limit**: personal = 10 msg / 5 sec; official bot = 300 msg / 60 sec
- **No unsolicited DMs** — users must opt in to receive tournament invites or be rivals to receive snipe alerts

## Tech stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Supabase) · next-auth · Vercel Pro (Cron Jobs)

---

## Sprint 8 — Ideas (not started)
- [ ] **Music taste matching** — cross-reference maps played / beatmapsets favorited to surface players with similar music taste. No other platform does this. Compelling differentiator beyond pp-based matching.
- [ ] **Community infrastructure** — support for established osu! communities (e.g. BTMC's osu! Roundtable) to run their own events, recruit members, and organize within osu!friends
- [ ] Tournament history page — past results, who won, pp improvements
- [ ] Onboarding flow for new users (first-time experience, prompt to set preferred modes)
- [ ] User search (find any osufriends user by username)
- [ ] Rival leaderboard — who has the most active rivals? most snipes?
- [ ] Tournament stats — win/loss, average pp of opponents
- [ ] Official osu! bot account (apply when user base grows)
- [ ] Discord bot integration (mirror tournament/rival notifications to Discord)

---

## Sprint 7 — In progress

### Shipped this session
- [x] Live lobby pp filter: replaced account pp with host avg top-play pp; ±15% bucket sort (apples-to-apples with rest of app)
- [x] Smooth scroll site-wide via Lenis
- [x] Background video on home page (self-hosted MP4 via Git LFS, 169MB 1080p with audio)
- [x] Mute/unmute button with volume slider + equalizer animation (fixed bottom-right)
- [x] OAuth token auto-refresh in JWT callback (fixes osu! friends section disappearing after 24h)
- [x] osu! username space/underscore normalization on profile lookup
- [x] 10-min DM cooldown per host, persisted in DB (`LobbyDm` model), status checked on mount
- [x] NavBar: Discover link moved next to osu!friends logo
- [x] Live lobbies heading shows star range (e.g. 3.2–5.2★) + "Hosts within your skill level towards top"
- [x] Discover: "All members" toggle removes pp filter to show all registered users
- [x] Profile: "Friends on osu!friends" label
- [x] PgBouncer transaction mode (port 6543 + ?pgbouncer=true) — fixes EMAXCONNSESSION on Supabase free tier
- [ ] Landing page redesign / marketing copy for new visitors
- [ ] Tournament history page — past results, who won, pp improvements
- [ ] Onboarding flow for new users (first-time experience, prompt to set preferred modes)
- [ ] User search (find any osufriends user by username)
- [ ] Rival leaderboard — who has the most active rivals? most snipes?
- [ ] Tournament stats — win/loss, average pp of opponents
- [ ] Official osu! bot account (Phase 2 — apply when user base grows)
- [ ] Discord bot integration (Phase 3 — mirror tournament/rival notifications to Discord)
