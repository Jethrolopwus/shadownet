"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === href ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
    }`;
  return (
    <header className="w-full sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          ShadowNet
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/wallet" className={linkClass("/wallet")}>Wallet</Link>
          <Link href="/merchant" className={linkClass("/merchant")}>Merchant</Link>
          <Link href="/verifier" className={linkClass("/verifier")}>Verifier</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}


