// src/components/MobileTabBar.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, Search, Gift, User } from "lucide-react";

export default function MobileTabBar({ height = 64 }) {
  const nav = useNavigate();
  const loc = useLocation();
  const is = (p) => loc.pathname === p;

  return (
    <>
      {/* set the mobile dock height variable globally */}
      <style>{`:root{ --mobile-dock-h: ${height}px; }`}</style>

      <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 pointer-events-none">
        <nav
          className="pointer-events-auto bg-slate-900/95 backdrop-blur border-t border-white/10 rounded-t-2xl rounded-b-none shadow-[0_-6px_30px_rgba(0,0,0,.35)]"
          style={{ height }}
        >
          <ul className="grid grid-cols-4 h-full">
            {[
              { to: "/", label: "Market", icon: <HomeIcon size={20} /> },
              { to: "/feed", label: "Feed", icon: <Search size={20} /> },
              { to: "/paper", label: "Earn", icon: <Gift size={20} /> },
              { to: "/profile", label: "Profile", icon: <User size={20} /> },
            ].map((t) => (
              <li key={t.to} className="flex items-center justify-center">
                <button
                  onClick={() => nav(t.to)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 transition ${
                    is(t.to) ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.icon}
                  <span className="text-[11px] leading-4">{t.label}</span>
                  <span
                    className={`absolute -bottom-1 h-1 w-6 rounded-full transition ${
                      is(t.to) ? "bg-white/80" : "bg-transparent"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
