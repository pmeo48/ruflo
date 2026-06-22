'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Search, GitBranch, Layers,
  BarChart2, Megaphone, Zap, TrendingUp, Bot, Star, ImageIcon, ShoppingBag, Store, Mail, Share2, Settings, Users, Ticket, MessageSquare, Receipt, DollarSign, PenLine, FlaskConical, UserCircle, Lightbulb, ClipboardCheck, KeyRound
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/design', icon: ImageIcon, label: 'Design Studio' },
  { href: '/copywriter', icon: PenLine, label: 'Copy Writer' },
  { href: '/abtesting', icon: FlaskConical, label: 'A/B Testing' },
  { href: '/etsy', icon: ShoppingBag, label: 'Etsy Listings' },
  { href: '/store', icon: Store, label: 'Storefront' },
  { href: '/customer', icon: UserCircle, label: 'Customer Portal' },
  { href: '/orders', icon: Receipt, label: 'Orders' },
  { href: '/emails', icon: Mail, label: 'Email Center' },
  { href: '/pinterest', icon: Share2, label: 'Pinterest' },
  { href: '/affiliates', icon: Users, label: 'Affiliates' },
  { href: '/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/reviews', icon: MessageSquare, label: 'Reviews' },
  { href: '/ideas', icon: Lightbulb, label: 'Idea Generator' },
  { href: '/listing-audit', icon: ClipboardCheck, label: 'Listing Audit' },
  { href: '/keywords', icon: KeyRound, label: 'Keyword Research' },
  { href: '/pricing', icon: DollarSign, label: 'Price Optimizer' },
  { href: '/seo', icon: Search, label: 'SEO Engine' },
  { href: '/expansion', icon: GitBranch, label: 'Expansion' },
  { href: '/bundles', icon: Layers, label: 'Bundles' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/research', icon: TrendingUp, label: 'Research' },
  { href: '/marketing', icon: Megaphone, label: 'Marketing' },
  { href: '/automation', icon: Zap, label: 'Automation' },
  { href: '/vault', icon: Star, label: 'Growth Vault' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col h-full w-[260px] flex-shrink-0"
      style={{ backgroundColor: '#0f0f23', borderRight: '1px solid #2a2a4a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #2a2a4a' }}>
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">Etsy AI Platform</div>
          <div className="text-xs" style={{ color: '#6060a0' }}>Business Dashboard</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="px-3 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4040600' }}>
            Main Menu
          </span>
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #2a2a4a' }}>
        <div className="rounded-lg p-3" style={{ backgroundColor: '#1a1a3e' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs font-medium text-white">AI Ready</span>
          </div>
          <p className="text-xs" style={{ color: '#8080a0' }}>
            GPT-4 + Claude connected. All generators active.
          </p>
        </div>
      </div>
    </aside>
  )
}
