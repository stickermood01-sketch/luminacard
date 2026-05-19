"use client";

import Link from 'next/link';
import { LayoutDashboard, Library, BookOpen, Settings, Search, PlusCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/decks', label: 'Library', icon: Library },
    { href: '/study', label: 'Study', icon: BookOpen },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card hidden md:flex flex-col p-4 z-50">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-headline font-bold tracking-tight">LuminaCard</span>
      </div>

      <div className="space-y-1 mb-6">
        <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main Menu
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-secondary text-primary" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}>
                <Icon className="w-4 h-4" />
                {link.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-muted-foreground">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const links = [
    { href: '/dashboard', label: 'Dash', icon: LayoutDashboard },
    { href: '/decks', label: 'Library', icon: Library },
    { href: '/study', label: 'Study', icon: BookOpen },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card md:hidden flex items-center justify-around px-4 z-50">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1">
            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-[10px]", isActive ? "text-primary" : "text-muted-foreground")}>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}