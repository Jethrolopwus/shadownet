import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-16">
      <section className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600 bg-white">
            <span className="size-1.5 rounded-full bg-orange-500"></span>
            Digital Design Agency
          </div>
          <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight text-gray-900">
            We Transform Ideas
            <span className="block italic text-gray-500">into digital experiences</span>
          </h1>
          <p className="mt-6 text-gray-600 max-w-prose">
            We craft fast, accessible experiences. Connect your Xverse wallet and explore
            ShadowNet capabilities in a clean, minimal interface.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/wallet"
              className="px-5 py-3 rounded-full bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              Get In Touch
            </Link>
            <Link
              href="/wallet"
              className="px-5 py-3 rounded-full border hover:bg-gray-50"
            >
              Portfolio
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
