'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Users, Calendar, BarChart3, MessageSquare, Star, Megaphone, Heart, HelpCircle, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Content', path: '/admin/content', icon: Calendar },
  { label: 'Progress', path: '/admin/progress', icon: BarChart3 },
  { label: 'Queries', path: '/admin/queries', icon: MessageSquare },
  { label: 'Reviews', path: '/admin/reviews', icon: Star },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Wellness', path: '/admin/wellness', icon: Heart },
  { label: 'FAQs', path: '/admin/faqs', icon: HelpCircle },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login page gets no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) })
    router.push('/admin/login')
    router.refresh()
  }

  const currentLabel = navItems.find(n => pathname.startsWith(n.path))?.label || 'Admin'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-gray-900 text-white">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-sm">HealEasy Admin</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = pathname.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-green-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm">{currentLabel}</span>
        </div>
        <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">H</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-gray-900 text-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="font-semibold text-sm">HealEasy Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map(({ label, path, icon: Icon }) => {
                const active = pathname.startsWith(path)
                return (
                  <button
                    key={path}
                    onClick={() => { router.push(path); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-green-600 text-white font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                )
              })}
            </nav>

            <div className="px-2 py-3 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-56 mt-12 md:mt-0">
        {children}
      </main>
    </div>
  )
}
