'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import SmoothScroll from './SmoothScroll';

export default function NavWrapper() {
  const pathname = usePathname();
  if (pathname.startsWith('/widget')) return null;
  return (
    <>
      <SmoothScroll />
      <NavBar />
    </>
  );
}
