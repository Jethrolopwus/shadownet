import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-16">
      <section className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight text-gray-900">
           Get Paid in Bitcoin.
            <span className="block italic text-gray-500">Keep Your Financial Privacy.</span>
          </h1>
          <p className="mt-6 text-gray-600 max-w-prose">
            ShadowNet gives you verifiable payment receipts without exposing your entire wallet history
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/merchant"
              className="px-5 py-3 rounded-full bg-black text-white hover:bg-gray-100 hover:border hover:text-black transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/verifier"
              className="px-5 py-3 rounded-full border hover:bg-black hover:border hover:text-white"
            >
             Proof Verifier
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl border shadow-inner bg-gradient-to-br from-orange-200 via-white to-orange-100" />
        </div>
      </section>
    </div>
  );
}
