import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Nunito } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import NavWrapper from '@/components/NavWrapper';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
});

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'osu!friends — find your osu! crew',
  description: 'Match with osu! players at your skill level who play when you do.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: { rel: 'manifest', url: '/site.webmanifest' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased bg-gray-950 text-white`} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
        <Providers>
          <NavWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
