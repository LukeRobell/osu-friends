# osu!friends

A matchmaking platform for [osu!](https://osu.ppy.sh) players — find skill-matched teammates, challenge rivals across all four game modes, and compete on a monthly snipe leaderboard.

**Live demo:** [osu-friends.vercel.app](https://osu-friends.vercel.app) (click "Try Demo →", no account needed)

> **Not affiliated with osu! or ppy Pty Ltd.** This is an independent, open-source passion project. "osu!" is a trademark of ppy Pty Ltd. If you fork this project and build a commercial product, you must rename it — peppy has made clear he does not want third-party commercial projects using the osu! name.

---

## What it does

- **Skill-matched discovery** — uses average top-play pp (not account pp) to surface players within ±15% of your level
- **Rival system** — add up to 3 rivals per game mode (osu!, Taiko, Catch, Mania); get challenged when they post a big play and have 7 days to snipe it
- **Snipe leaderboard** — monthly rankings of who's sniping the most across all modes
- **Live lobby finder** — browse real-time multiplayer rooms filtered to your star rating
- **Team matchmaking** — auto-matched 4v4 tournaments at your skill level
- **OBS overlays** — browser source overlays for recent signups and live stats (built for Twitch streamers)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Auth | NextAuth.js — osu! OAuth2 provider |
| Database | Supabase (PostgreSQL) via Prisma ORM |
| Styling | Tailwind CSS |
| Deployment | Vercel (with Cron Jobs for rank sync) |

## Getting started (self-hosting)

### 1. Clone and install

```bash
git clone https://github.com/LukeRobell/osu-friends.git
cd osu-friends
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
# osu! OAuth — register at https://osu.ppy.sh/home/account/edit#oauth
OSU_CLIENT_ID=your_client_id
OSU_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Supabase / PostgreSQL
# DATABASE_URL uses the connection pooler (port 6543)
# DIRECT_URL bypasses the pooler — required for Prisma migrations
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 3. Database setup

```bash
npx prisma migrate deploy
npm run db:seed        # optional: seeds 15 demo players + rivals + snipe challenges
```

### 4. Re-enable osu! sign-in

The live demo disables the osu! sign-in button so visitors can't create real accounts. To turn it back on:

**`app/page.tsx`** — replace the hero "Try Demo →" button group with:
```tsx
<button onClick={() => signIn('osu')} className="px-10 py-3.5 border-2 border-pink-500 text-pink-400 hover:bg-pink-500/10 rounded-full font-semibold text-lg transition-colors">
  Sign in with osu!
</button>
```

**`components/NavBar.tsx`** — change the nav button's `onClick` from `signIn('demo', ...)` to `signIn('osu')` and update the label to "Sign in".

The osu! OAuth provider in [`lib/auth.ts`](lib/auth.ts) is fully configured — it just needs your env vars and the buttons wired back up.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                      Next.js App Router pages
  api/                    API routes (auth, osu! sync, public endpoints)
  discover/               Player discovery feed
  leaderboard/            Players + Rivals monthly leaderboard
  profile/[username]/     User profiles with rival cards
  teams/                  Team matchmaking
components/               Shared React components
lib/
  auth.ts                 NextAuth config (osu! OAuth + demo CredentialsProvider)
  osu-api.ts              osu! API v2 client
  prisma.ts               Prisma client singleton
prisma/
  schema.prisma           Database schema
scripts/
  seed-demo.ts            Demo seed (15 players, rivals, snipe challenges)
public/
  obs-signup-overlay.html OBS browser source — recent signup carousel
```

## Cron jobs

Two Vercel Cron Jobs keep data fresh (configured in `vercel.json`):

- `/api/cron/sync-ranks` — refreshes global ranks for active users daily
- `/api/cron/check-snipes` — polls osu! API for new scores, triggers snipe challenges

Both require a `CRON_SECRET` env var (any random string; set it in Vercel and match it in your `.env`).

## Demo mode

The deployed demo uses a `CredentialsProvider` that signs in as a seeded demo user with no password. An amber banner indicates demo mode throughout the UI. Real osu! accounts can't be created on the demo deployment — that's intentional.

Run `npm run db:seed` at any time to reset the demo data.

## Disclaimer

This project is **not affiliated with, endorsed by, or associated with osu! or ppy Pty Ltd** in any way. "osu!" is a registered trademark of ppy Pty Ltd. This software is provided as-is for educational and portfolio purposes. If you deploy this publicly or build a commercial product on top of it, you are responsible for complying with osu!'s terms of service and must rename the project.

## License

MIT. Fork freely.

---

Built by [Luke Robell](https://github.com/LukeRobell) · [lukerobell.com](https://lukerobell.com)
