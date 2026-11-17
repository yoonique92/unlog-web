"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Users,
  Sparkles,
  Heart,
  Gem,
} from "lucide-react";

const menus = [
  {
    label: "홈",
    href: "/",
    icon: House,
  },
  {
    label: "로그 프렌즈",
    href: "/friends",
    icon: Users,
  },
  {
    label: "사주보기",
    href: "/saju",
    icon: Sparkles,
  },
  {
    label: "궁합보기",
    href: "/compatibility",
    icon: Heart,
  },
  {
    label: "로그 상점",
    href: "/charge",
    icon: Gem,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="relative z-50 w-full shrink-0 border-t border-[#D8D2F3] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="grid h-[62px] grid-cols-5">
        {menus.map((menu) => {
          const Icon = menu.icon;

          const isActive =
            menu.href === "/"
              ? pathname === "/"
              : pathname.startsWith(menu.href);

          return (
            <Link
              key={menu.label}
              href={menu.href}
              className="flex flex-col items-center justify-center gap-[3px]"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.3 : 1.7}
                fill="none"
                className={
                  isActive
                    ? "text-[#6246EA]"
                    : "text-[#A8A0C8]"
                }
              />

              <span
                className={`text-[10px] ${
                  isActive
                    ? "font-bold text-[#6246EA]"
                    : "font-normal text-[#8F88AB]"
                }`}
              >
                {menu.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
