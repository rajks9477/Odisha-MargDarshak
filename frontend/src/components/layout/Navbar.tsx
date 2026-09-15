"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { DEMO_USERS, UserRole, ROLE_CONFIGS } from "@/lib/constants";
import { 
  Compass,
  LogOut, 
  ChevronDown, 
  Sparkles, 
  Menu, 
  X,
  User as UserIcon,
  Shield
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide global navbar on home page and authentication pages
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return null;
  }

  const isLandingPage = pathname === "/";
  const dashboardHref = user ? (ROLE_CONFIGS[user.role as UserRole]?.dashboardPath || "/dashboard/citizen") : "/login";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 text-stone-900 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-stone-900">
                NER–MargDarshak
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                Gov Logistics AI
              </span>
            </div>
          </Link>

          {/* Right Action: Clean on Landing Page vs Logged in Dashboard controls */}
          {isLandingPage ? (
            <div className="flex items-center gap-2">
              {/* Clean landing header matching screenshot */}
            </div>
          ) : (
            /* Dashboard View Controls */
            <div className="flex items-center gap-2.5">
              {isAuthenticated && user && (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-stone-900 leading-tight">
                        {user.name?.split(" ")[0]}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in">
                      <div className="px-3 py-2 border-b border-stone-100">
                        <div className="text-xs font-bold text-stone-900">{user.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono truncate">{user.email}</div>
                        <div className="mt-1">
                          <RoleBadge role={user.role} size="sm" />
                        </div>
                      </div>

                      <Link
                        href={dashboardHref}
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Workspace Dashboard</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
