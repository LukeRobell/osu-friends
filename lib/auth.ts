import { NextAuthOptions } from 'next-auth';
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
    {
      id: 'osu',
      name: 'osu!',
      type: 'oauth',
      clientId: process.env.OSU_CLIENT_ID,
      clientSecret: process.env.OSU_CLIENT_SECRET,
      authorization: {
        url: 'https://osu.ppy.sh/oauth/authorize',
        params: { scope: 'identify public chat.write friends.read' },
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

      const rank = p.statistics?.global_rank ?? null;
      // Average of top 5 plays — same metric used for seeded players and discover filtering
      const pp = await fetchUserAvgTopPp(p.id, p.playmode ?? 'osu');

      await prisma.user.upsert({
        where: { osuId: p.id },
        update: {
          username: p.username,
          avatarUrl: p.avatar_url,
          globalRank: rank,
          countryCode: p.country_code,
          pp,
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
          isRegistered: true,
          lastSeen: new Date(),
        },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (profile) {
        const p = profile as unknown as OsuProfile;
        token.osuId = p.id;
        token.username = p.username;
        token.globalRank = p.statistics?.global_rank ?? null;
        token.avatarUrl = p.avatar_url;
        token.countryCode = p.country_code;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.osuId = token.osuId;
      session.user.username = token.username;
      session.user.globalRank = token.globalRank;
      session.user.avatarUrl = token.avatarUrl;
      session.user.countryCode = token.countryCode;
      return session;
    },
  },
};
