"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === href
      ? "bg-black text-white"
      : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
       
        <Link href="/" className="font-semibold tracking-tight text-lg sm:text-xl">
          ShadowNet
        </Link>

      
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/merchant" className={linkClass("/merchant")}>Merchant</Link>
          <Link href="/verifier" className={linkClass("/verifier")}>Verifier</Link>
          <Link href="/receipts" className={linkClass("/receipts")}>Receipts</Link>
          <Link href="/update_admin" className={linkClass("/update_admin")}>UpdateAdmin</Link>
          <a
            href="https://github.com/Jethrolopwus/shadownet"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 text-gray-700"
          >
            GitHub
          </a>
          <div className="ml-4">
            <WalletConnectButton />
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="flex flex-col px-4 py-3 space-y-1">
            <Link
              href="/"
              className={linkClass("/")}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/merchant"
              className={linkClass("/merchant")}
              onClick={() => setMenuOpen(false)}
            >
              Merchant
            </Link>
            <Link
              href="/verifier"
              className={linkClass("/verifier")}
              onClick={() => setMenuOpen(false)}
            >
              Verifier
            </Link>
            <Link
              href="/receipts"
              className={linkClass("/receipts")}
              onClick={() => setMenuOpen(false)}
            >
              Receipts
            </Link>
            <Link
              href="/update_admin"
              className={linkClass("/update_admin")}
              onClick={() => setMenuOpen(false)}
            >
              UpdateAdmin
            </Link>
            <a
              href="https://github.com/Jethrolopwus/shadownet"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              GitHub
            </a>
            <div className="pt-3 border-t">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
