import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tighter text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500" />
          Disciplinear
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
