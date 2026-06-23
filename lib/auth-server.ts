import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

// Reads the osu! OAuth access token from the session JWT cookie.
// Use this in server components — getToken() only works in Route Handlers, not RSCs.
export async function getAccessToken(): Promise<string | null> {
  if (!process.env.NEXTAUTH_SECRET) return null;
  const cookieStore = cookies();
  const sessionToken =
    cookieStore.get('next-auth.session-token')?.value ??
    cookieStore.get('__Secure-next-auth.session-token')?.value;
  if (!sessionToken) return null;
  const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET });
  return (token?.accessToken as string) ?? null;
}
