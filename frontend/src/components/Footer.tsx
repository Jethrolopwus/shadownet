export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4 sm:gap-6 text-sm text-gray-600">
      
        <div className="w-full sm:w-auto">
          © {year} <span className="font-semibold text-gray-800">ShadowNet</span>. All rights reserved.
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
          <a
            href="#"
            className="hover:text-gray-900 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-gray-900 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Terms
          </a>
          <a
            href="#"
            className="hover:text-gray-900 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
