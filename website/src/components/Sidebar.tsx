import Link from 'next/link';
import { Home, CalendarDays, BarChart2, Settings, LogOut } from 'lucide-react';
import { signout } from '@/app/login/actions';

export default function Sidebar() {
  return (
    <div className="w-full md:w-[260px] md:h-screen md:sticky top-0 flex flex-col pt-10 pb-6 px-4 md:px-6">
      <div className="mb-10 pl-2">
        <Link href="/dashboard" className="font-bold text-2xl tracking-tight text-[var(--text-primary)] flex items-center gap-3 transition-transform origin-left">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[var(--accent-color)] to-indigo-400 shadow-sm transform -rotate-3" />
          Disciplinear
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Home" />
        <SidebarLink href="/dashboard/stats" icon={<BarChart2 size={18} />} label="Analytics" />
      </nav>

      <div className="space-y-1">
        <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" />
        <form action={signout}>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 text-[15px] font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all active:scale-[0.98]">
      {icon}
      {label}
    </Link>
  );
}
