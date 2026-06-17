import Link from "next/link";
import { BookOpen, CalendarDays, ListChecks, Mic, Search, Settings } from "lucide-react";

const navItems = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/record", label: "Record", icon: Mic },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/ask", label: "Ask", icon: Search },
  { href: "/open-loops", label: "Open Loops", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <h1 className="wordmark" aria-label="MindMic">
              <span className="wordmark-mind">Mind</span>
              <span className="wordmark-divider" aria-hidden="true" />
              <span className="wordmark-mic">Mic</span>
            </h1>
            <p>Private notes</p>
          </div>
        </div>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <header className="mobile-topbar" aria-label="MindMic">
          <span className="wordmark">
            <span className="wordmark-mind">Mind</span>
            <span className="wordmark-divider" aria-hidden="true" />
            <span className="wordmark-mic">Mic</span>
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}
