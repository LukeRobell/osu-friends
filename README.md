# osufriends.com

A matchmaking web app for osu! players to find friends with similar skill levels and playtimes.

## What it does

- Log in with your osu! account via OAuth
- We pull your rank, avatar, and game mode preferences from the osu! API v2
- Browse other players filtered by rank range and game mode
- Send friend requests to people who play when you do

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — dark theme with osu! pink/purple accents
- **Prisma** + PostgreSQL (Supabase)
- **next-auth** — osu! OAuth 2.0
- **Vercel** — deployment

## Getting started

```bash
cp .env.example .env
# fill in your osu! OAuth credentials and DATABASE_URL

npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## osu! OAuth setup

1. Go to https://osu.ppy.sh/home/account/edit → OAuth → New OAuth Application
2. Set callback URL to `http://localhost:3000/api/auth/callback/osu`
3. Copy Client ID and Client Secret into `.env`

## Environment variables

See [`.env.example`](.env.example) for all required variables.
