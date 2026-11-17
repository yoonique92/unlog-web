import Link from "next/link";

const menus = [
  {
    label: "홈",
    href: "/",
    icon: "⌂",
  },
  {
    label: "로그 프렌즈",
    href: "/friends",
    icon: "✦",
  },
  {
    label: "사주보기",
    href: "/saju",
    icon: "命",
    center: true,
  },
  {
    label: "궁합보기",
    href: "/compatibility",
    icon: "♡",
  },
  {
    label: "충전하기",
    href: "/charge",
    icon: "◇",
  },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2 rounded-[30px] border border-white/40 bg-white/70 px-3 py-3 shadow-lg backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end">
        {menus.map((menu) => (
          <Link
            key={menu.label}
            href={menu.href}
            className="flex flex-col items-center justify-end gap-1 text-center"
          >
            {menu.center ? (
              <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#643BFF] text-xl font-bold text-white shadow-lg">
                {menu.icon}
              </div>
            ) : (
              <div className="flex h-8 items-center justify-center text-xl text-[#6656C9]">
                {menu.icon}
              </div>
            )}

            <span
              className={`text-[11px] font-semibold ${
                menu.center
                  ? "text-[#4B34C7]"
                  : "text-[#655A9D]"
              }`}
            >
              {menu.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}