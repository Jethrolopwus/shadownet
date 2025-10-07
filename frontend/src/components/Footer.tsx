export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div>© {year} ShadowNet. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Contact</a>
        </div>
      </div>
    </footer>
  );
}


