"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import BottomNavigation from "../home/BottomNavigation";
import MobileHeader from "../home/MobileHeader";

const unframedPrefixes = ["/api", "/auth", "/dev", "/test"];
const desktopBreakpoint = 640;
const designWidth = 430;
const designHeight = 900;
const chromePaths = new Set(["/", "/friends", "/saju", "/compatibility", "/charge", "/my", "/today"]);

export default function AppViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const [desktopScale, setDesktopScale] = useState<number | null>(null);
  const isUnframed = unframedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const hasAppChrome = chromePaths.has(pathname);
  const contentMode = pathname === "/" ? "fixed" : "scrollable";

  useLayoutEffect(() => {
    function updateScale() {
      if (window.innerWidth < desktopBreakpoint) {
        setDesktopScale(null);
        return;
      }

      setDesktopScale(
        Math.min(window.innerHeight / designHeight, window.innerWidth / designWidth)
      );
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (isUnframed) return <div className="app-unframed">{children}</div>;

  const frameStyle = desktopScale
    ? {
        width: designWidth * desktopScale,
        height: designHeight * desktopScale,
      }
    : undefined;

  return (
    <div className="app-viewport">
      <div className="app-frame" style={frameStyle}>
        <div className="app-shell">
          {hasAppChrome && <MobileHeader />}
          <div
            className={`app-scroll${contentMode === "fixed" ? " app-scroll-fixed" : ""}`}
          >
            {children}
          </div>
          {hasAppChrome && <BottomNavigation />}
        </div>
      </div>
    </div>
  );
}
