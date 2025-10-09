"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export function Navbar() {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${pathname === href ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
    }`;
  return (
    <header className="w-full sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          ShadowNet
        </Link>
        <div className="flex  items-center gap-1">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/merchant" className={linkClass("/merchant")}>Merchant</Link>
          <Link href="/verifier" className={linkClass("/verifier")}>Verifier</Link>
          <Link href="/receipts" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
            Receipts
          </Link>
          <Link href="/update_admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
            UpdateAdmin
          </Link>
          <a
            href="https://github.com/Jethrolopwus/shadownet"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
          >
            GitHub
          </a>
          <div className=" pl-20">

            <WalletConnectButton />
          </div>
        </div>
      </nav>
    </header>
  );
}


