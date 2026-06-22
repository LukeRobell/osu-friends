# osufriends.com — prototype sprint plan

## Vision
A matchmaking site for osu! players. Users log in with their osu! account, we pull their rank and recent activity via osu! API v2, and we match them with players at similar skill levels who play at similar times.

## Tonight's prototype goal
A working app where a user can:
1. Log in with osu! OAuth
2. See their own profile (rank, avatar, preferred modes)
3. Browse a list of other users filtered by rank range
4. Send a friend request

## Sprint 1 — Auth + profile (tonight, ~2 hrs)
- [ ] osu! OAuth via next-auth
- [ ] Fetch user data from osu! API v2 on first login (rank, avatar, country, username)
- [ ] Save user to DB via Prisma
- [ ] /profile/[username] page showing osu! stats

## Sprint 2 — Discovery feed (~2 hrs)
- [ ] /discover page listing users
- [ ] Filter by rank range (slider)
- [ ] Filter by game mode (osu!, taiko, mania, catch)
- [ ] Pull play-time data from osu! recent activity endpoint

## Sprint 3 — Friend requests (~1 hr)
- [ ] Send / accept / decline friend request UI
- [ ] Friends list on profile page

## Sprint 4 — Polish + deploy (end of night)
- [ ] Dark theme matching osu! aesthetic (pink/purple accents, dark bg)
- [ ] Deploy to Vercel
- [ ] Point osufriends.com domain

## osu! API notes
- Base URL: https://osu.ppy.sh/api/v2
- Auth: OAuth 2 (client credentials or authorization code)
- Key endpoints:
  - GET /me — authenticated user's own data
  - GET /users/{user} — public user profile + rank
  - GET /users/{user}/recent_activity — recent plays (use for activity window)
  - GET /users/{user}/scores/recent — recent scores

## Tech stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Supabase) · next-auth · Vercel
