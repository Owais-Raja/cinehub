"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCity } from "./Providers";
import { INDIAN_CITIES } from "@/lib/constants";
import {
  Film,
  MapPin,
  Search,
  User,
  Shield,
  QrCode,
  LogOut,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const { selectedCity, setSelectedCity, cityName } = useCity();
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#171923]/95 backdrop-blur-md border-b border-[#2D3748]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#E83B50] flex items-center justify-center text-white shadow-lg shadow-[#E83B50]/30 group-hover:scale-105 transition-transform">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              CINE<span className="text-[#E83B50]">HUB</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#E8B86D] font-bold">
              India&apos;s Cinema
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <Search className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movies, genres or theatres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242B3A] text-sm text-[#F4F3F0] rounded-full pl-9 pr-4 py-2 border border-[#2D3748] focus:outline-none focus:border-[#E83B50] transition-colors"
          />
        </form>

        {/* Right Actions: City + User State */}
        <div className="flex items-center gap-3">
          {/* City Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242B3A] border border-[#2D3748] text-xs font-medium text-[#F4F3F0] hover:border-[#E8B86D] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E8B86D]" />
              <span>{cityName}</span>
            </button>

            {showCityDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#242B3A] border border-[#2D3748] rounded-xl shadow-xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#8E9AA8] uppercase tracking-wider">
                  Select Popular City
                </div>
                {INDIAN_CITIES.map((city) => (
                  <button
                    key={city.slug}
                    onClick={() => {
                      setSelectedCity(city.slug);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#1E2430] transition-colors flex items-center justify-between ${
                      selectedCity === city.slug
                        ? "text-[#E83B50] font-bold"
                        : "text-[#F4F3F0]"
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] text-[#8E9AA8]">{city.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role specific shortcuts */}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8B86D]/15 text-[#E8B86D] border border-[#E8B86D]/30 text-xs font-semibold hover:bg-[#E8B86D]/25 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}

          {(session?.user?.role === "STAFF" || session?.user?.role === "ADMIN") && (
            <Link
              href="/staff/scanner"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scanner</span>
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/customer/bookings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242B3A] text-xs font-medium text-[#F4F3F0] hover:text-[#E83B50] transition-colors"
              >
                <Ticket className="w-3.5 h-3.5 text-[#E83B50]" />
                <span className="hidden sm:inline">My Bookings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign Out"
                className="p-1.5 rounded-lg bg-[#242B3A] text-[#8E9AA8] hover:text-[#E83B50] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-semibold shadow-md shadow-[#E83B50]/20 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
