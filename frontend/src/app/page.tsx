import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-16">
      <section className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6">
        <div>
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight text-white">
           Get Paid in Bitcoin.
            <span className="block italic text-gray-300">Keep Your Financial Privacy.</span>
          </h1>
          <p className="mt-6 text-gray-200 max-w-prose">
            ShadowNet gives you verifiable payment receipts without exposing your entire wallet history
          </p>
          <div className="mt-8 flex flex-wrap  items-center gap-6">
            <Link
              href="/merchant"
              className="px-10 py-4 rounded-full bg-white text-[#003B7A] hover:bg-gray-100 transition-colors font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/verifier"
              className="px-10 py-4 rounded-full border border-white text-white hover:bg-white hover:text-[#003B7A] transition-colors"
            >
             Proof Verifier
            </Link>
          </div>
        </div>
        <div className="relative w-full h-full">
          <div className="aspect-[4/3] w-full h-[500px] md:h-[600px] md:w-[800px] rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm">
            <Image
              src="/Bitcoin.jpg"
              alt="Bitcoin Payment Privacy"
              fill
              className="object-cover opacity-90"
              priority
            />
          </div>
        </div>
      </section>
    </div>
  );
}