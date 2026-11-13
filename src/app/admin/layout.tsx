"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Building2,
  Calendar,
  BarChart3,
  ScrollText,
  ShieldAlert,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Occupancy & Sales Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Movie Catalog", href: "/admin/movies", icon: Film },
    { name: "Audit Trail", href: "/admin/audit-logs", icon: ScrollText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-4 shadow-xl">
            <div className="px-3 py-2 mb-3 border-b border-[#2D3748]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8B86D] block">
                ADMIN CONSOLE
              </span>
              <h2 className="text-base font-black text-white">Cinema Operations</h2>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/30"
                        : "text-[#8E9AA8] hover:text-white hover:bg-[#1E2430]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Admin Content Area */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
