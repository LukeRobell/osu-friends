import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      osuId: number;
      username: string;
      globalRank: number | null;
      avatarUrl: string;
      countryCode: string;
      isDemo?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    osuId: number;
    username: string;
    globalRank: number | null;
    avatarUrl: string;
    countryCode: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // unix seconds
    error?: string;
    isDemo?: boolean;
  }
}
