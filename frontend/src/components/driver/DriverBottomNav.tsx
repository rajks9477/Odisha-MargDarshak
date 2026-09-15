"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Map, 
  Navigation, 
  Bell, 
  User as UserIcon 
} from "lucide-react";

import { AlertService } from "@/features/alerts/services/alertService";

interface DriverBottomNavProps {
  unreadAlertCount?: number;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({ unreadAlertCount }) => {
  const pathname = usePathname();
  const [badgeCount, setBadgeCount] = React.useState<number>(unreadAlertCount || 0);

  React.useEffect(() => {
    if (unreadAlertCount !== undefined) {
      setBadgeCount(unreadAlertCount);
    } else {
      AlertService.getUnreadCount()
        .then((res) => setBadgeCount(res.unread_count))
        .catch(() => {});
    }
  }, [unreadAlertCount]);

  const navItems = [
    {
      label: "Home",
      href: "/dashboard/driver",
      icon: Home,
      exact: true,
    },
    {
      label: "Live Map",
      href: "/dashboard/driver/map",
      icon: Map,
      exact: false,
    },
    {
      label: "My Route",
      href: "/dashboard/driver/route",
      icon: Navigation,
      exact: false,
    },
    {
      label: "Alerts",
      href: "/dashboard/driver/alerts",
      icon: Bell,
      badge: badgeCount > 0 ? badgeCount : undefined,
      exact: false,
    },
    {
      label: "Profile",
      href: "/dashboard/driver/profile",
      icon: UserIcon,
      exact: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E8E2D8] py-2 px-3 sm:hidden shadow-lg font-sans">
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? "text-emerald-800 font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-700 scale-110" : "text-stone-400"}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
