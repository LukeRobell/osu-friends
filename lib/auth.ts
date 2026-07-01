import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { fetchUserAvgTopPp } from './osu-api';

interface OsuProfile {
  id: number;
  username: string;
  avatar_url: string;
  country_code: string;
  playmode: string;
  statistics?: {
    global_rank: number | null;
    pp: number | null;
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      id: 'demo',
      name: 'Demo',
      credentials: {},
      async authorize() {
        const demo = await prisma.user.findFirst({
          where: { username: 'im a fancy lad' },
          select: { osuId: true, username: true, avatarUrl: true, globalRank: true, countryCode: true },
        });
        if (!demo) return null;
        return {
          id: String(demo.osuId),
          name: demo.username,
          image: demo.avatarUrl,
          osuId: demo.osuId,
          globalRank: demo.globalRank,
          countryCode: demo.countryCode,
          isDemo: true,
        } as never;
      },
    }),
    {
      id: 'osu',
      name: 'osu!',
      type: 'oauth',
      clientId: process.env.OSU_CLIENT_ID,
      clientSecret: process.env.OSU_CLIENT_SECRET,
      authorization: {
        url: 'https://osu.ppy.sh/oauth/authorize',
        params: { scope: 'identify public friends.read' },
      },
      token: 'https://osu.ppy.sh/oauth/token',
      userinfo: 'https://osu.ppy.sh/api/v2/me',
      profile(profile: OsuProfile) {
        return {
          id: String(profile.id),
          name: profile.username,
          email: null,
          image: profile.avatar_url,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;
      const p = profile as unknown as OsuProfile;

      try {
        const rank = p.statistics?.global_rank ?? null;

        let pp: number | null = null;
        try {
          pp = await fetchUserAvgTopPp(p.id, p.playmode ?? 'osu');
        } catch {
          // Non-fatal — pp stays null, login still proceeds
        }

        await prisma.user.upsert({
          where: { osuId: p.id },
          update: {
            username: p.username,
            avatarUrl: p.avatar_url,
            globalRank: rank,
            countryCode: p.country_code,
            pp,
            preferredModes: [p.playmode ?? 'osu'],
            isRegistered: true,
            lastSeen: new Date(),
          },
          create: {
            osuId: p.id,
            username: p.username,
            avatarUrl: p.avatar_url,
            globalRank: rank,
            countryCode: p.country_code,
            pp,
            preferredModes: [p.playmode ?? 'osu'],
            languages: [],
            isRegistered: true,
            lastSeen: new Date(),
          },
        });
      } catch (err) {
        console.error('[auth] Failed to upsert user on sign-in:', err);
        return false;
      }

      return true;
    },

    async jwt({ token, account, profile, user }) {
      // Demo credentials login — user object comes from authorize(), not osu! profile
      if (user && (user as { isDemo?: boolean }).isDemo) {
        const u = user as { osuId: number; globalRank: number | null; countryCode: string; isDemo: boolean };
        token.osuId = u.osuId;
        token.username = user.name ?? '';
        token.avatarUrl = user.image ?? '';
        token.globalRank = u.globalRank;
        token.countryCode = u.countryCode;
        token.isDemo = true;
        return token;
      }

      if (profile) {
        const p = profile as unknown as OsuProfile;
        token.osuId = p.id;
        token.username = p.username;
        token.globalRank = p.statistics?.global_rank ?? null;
        token.avatarUrl = p.avatar_url;
        token.countryCode = p.country_code;
      }

      // Skip osu! token refresh for demo sessions
      if (token.isDemo) return token;

      if (account) {
        // Fresh sign-in — store access token, refresh token, and expiry
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt =
          account.expires_at ??
          (account.expires_in
            ? Math.floor(Date.now() / 1000) + (account.expires_in as number)
            : undefined);
        return token;
      }

      // No expiry stored (pre-refresh-fix session) or still valid — return as-is
      if (!token.expiresAt || Date.now() < token.expiresAt * 1000 - 60_000) {
        return token;
      }

      // Access token expired — refresh it
      if (!token.refreshToken) {
        token.error = 'RefreshTokenError';
        return token;
      }

      try {
        const res = await fetch('https://osu.ppy.sh/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.OSU_CLIENT_ID,
            client_secret: process.env.OSU_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
          }),
        });
        if (!res.ok) throw new Error(`osu! token refresh ${res.status}`);
        const refreshed = await res.json();
        token.accessToken = refreshed.access_token;
        token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
        token.expiresAt = Math.floor(Date.now() / 1000) + (refreshed.expires_in as number);
        delete token.error;
      } catch (err) {
        console.error('[auth] Failed to refresh osu! access token:', err);
        token.error = 'RefreshTokenError';
      }

      return token;
    },

    async session({ session, token }) {
      session.user.osuId = token.osuId;
      session.user.username = token.username;
      session.user.globalRank = token.globalRank;
      session.user.avatarUrl = token.avatarUrl;
      session.user.countryCode = token.countryCode;
      session.user.isDemo = token.isDemo ?? false;
      return session;
    },
  },
};
