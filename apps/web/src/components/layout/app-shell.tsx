import { Link, NavLink } from 'react-router-dom';
import { ClipboardList, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOGO_URL } from '@/lib/task-utils';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Tasks', icon: ClipboardList },
  { to: '/sync', label: 'Sync', icon: Link2 },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/buddy-9ef5fb0a.png" alt="Logo" className="h-8 w-auto object-contain" />
            <div>
              <p className="text-lg font-semibold tracking-tight" style={{ color: '#9a4f1a' }}>
                SoloTasker
              </p>
              <p className="text-xs text-muted-foreground">Fast personal tasks, synced by link</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Built for private, account-free task tracking across devices.</p>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="SoloTasker mark" className="h-6 w-auto object-contain" />
            <span>Clean light workspace with portable sync links.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
