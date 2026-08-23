'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import GrocGoLogo from '@/components/Logo';
import { LayoutDashboard, Store, Users, LogOut, X, Menu } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, loadFromStorage, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <img src="/logo.svg" alt="GrocGo" width={40} height={40} className="animate-bounce" draggable={false} />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col sm:flex-row overflow-hidden">
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin" className="flex items-center gap-1.5">
              <GrocGoLogo size={24} showText={false} />
              <span className="font-bold">GrocGo</span>
              <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Admin</span>
            </Link>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            <div className="flex items-center gap-2 px-5 h-14 border-b border-gray-100">
              <GrocGoLogo size={28} showText={false} />
              <span className="font-bold">GrocGo</span>
              <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Admin</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-grocgo-50 text-grocgo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="w-full flex items-center gap-2.5 text-sm text-gray-500 hover:text-red-600 px-4 py-3 rounded-xl hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex sm:flex-col sm:w-64 bg-white border-r h-screen sticky top-0 shrink-0 p-5 overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-2 mb-8">
          <GrocGoLogo size={32} showText={true} />
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold ml-1">Admin</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-grocgo-50 text-grocgo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="w-full flex items-center gap-2.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 safe-area-bottom">
        <nav className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[64px] ${
                  isActive(item.href)
                    ? 'text-grocgo-600'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content — scrollable */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-4 sm:p-8 pt-[72px] sm:pt-8 pb-20 sm:pb-8">
        {children}
      </main>
    </div>
  );
}
