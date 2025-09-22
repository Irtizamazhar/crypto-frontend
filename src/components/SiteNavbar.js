import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, BarChart3, Rss, Star, Bell, ChevronDown,
  LogOut, User as UserIcon, Search as SearchIcon
} from "lucide-react";
import LoaderBar from "./LoaderBar";
import SearchBar from "./SearchBar";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";

/* helpers */
function initialsFromName(n) {
  const s = String(n || "").trim();
  if (!s) return "U";
  return s.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
}

/* Desktop dropdown menu */
function UserMenuDesktop() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!user) {
    return (
      <button onClick={() => nav("/login")} className="rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm">
        Sign In
      </button>
    );
  }

  const name = user.name || user.email || "User";
  const init = initialsFromName(name);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold">
          {init}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur shadow-xl z-[70] overflow-hidden"
            role="menu"
          >
            <button
              onClick={() => { setOpen(false); nav("/profile"); }}
              className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2"
              role="menuitem"
            >
              <UserIcon size={16}/> Profile
            </button>
            <button
              onClick={() => { setOpen(false); logout(); nav("/"); }}
              className="w-full px-3 py-2 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2"
              role="menuitem"
            >
              <LogOut size={16}/> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Compact button for mobile header */
function UserButtonCompact() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <button
        onClick={() => nav("/login")}
        className="h-9 w-9 grid place-items-center rounded-full bg-white/10 text-slate-200 border border-white/10"
        aria-label="Sign in"
        title="Sign in"
      >
        <UserIcon size={18}/>
      </button>
    );
  }
  const init = initialsFromName(user.name || user.email);
  return (
    <button
      onClick={() => nav("/profile")}
      className="h-9 w-9 grid place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold"
      aria-label="Profile"
      title="Profile"
    >
      {init}
    </button>
  );
}

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);       // mobile menu
  const { _count } = useLoading();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  // close mobile menu on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const NavItem = ({ to, icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-4 py-2 rounded flex items-center gap-2 ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5"}`
      }
    >
      {icon} {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-[60]">
      <LoaderBar active={_count > 0} />

      <div className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 grid place-items-center"
            >
              <span className="font-black text-white">₿</span>
            </motion.div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold">CryptoSense</div>
              <div className="text-xs text-slate-400 -mt-1">Analyze • Decide • Win</div>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2 text-sm ml-2">
            <NavItem to="/"        icon={<BarChart3 size={18}/>} label="Market" />
            <NavItem to="/feed"    icon={<Rss size={18}/>}       label="Feed" />
            <NavItem to="/watchlist" icon={<Star size={18}/>}    label="Watchlist" />
            <NavItem to="/alerts"  icon={<Bell size={18}/>}      label="Alerts" />
          </nav>

          {/* Spacer pushes right cluster */}
          <div className="flex-1" />

          {/* Desktop search + user */}
          <div className="hidden md:block max-w-md w-full">
            <SearchBar variant="nav" placeholder="Search cryptocurrencies…" />
          </div>
          <div className="hidden md:block">
            <UserMenuDesktop />
          </div>

          {/* Right cluster (mobile): compact user + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Quick open search (mobile) */}
            <button
              onClick={() => nav("/search")}
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10"
              aria-label="Search"
            >
              <SearchIcon size={18} />
            </button>

            <UserButtonCompact />

            <button
              onClick={() => setOpen(v => !v)}
              aria-label="Menu"
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X size={22}/> : <Menu size={22}/>}
            </button>
          </div>
        </div>

        {/* Mobile menu (slide-down) */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur"
            >
              <div className="px-4 py-3 space-y-3">
                {/* Mobile search inside menu as well */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-2">
                  <SearchBar variant="nav" placeholder="Search..." />
                </div>

                <div className="grid gap-1">
                  <NavItem to="/"          icon={<BarChart3 size={18}/>} label="Market" onClick={() => setOpen(false)} />
                  <NavItem to="/feed"      icon={<Rss size={18}/>}       label="Feed" onClick={() => setOpen(false)} />
                  <NavItem to="/watchlist" icon={<Star size={18}/>}      label="Watchlist" onClick={() => setOpen(false)} />
                  <NavItem to="/alerts"    icon={<Bell size={18}/>}      label="Alerts" onClick={() => setOpen(false)} />
                </div>

                <div className="border-t border-white/10 pt-3">
                  {!user ? (
                    <button
                      onClick={() => { setOpen(false); nav("/login"); }}
                      className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2"
                    >
                      Sign In
                    </button>
                  ) : (
                    <div className="grid gap-2">
                      <button
                        onClick={() => { setOpen(false); nav("/profile"); }}
                        className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-left flex items-center gap-2"
                      >
                        <UserIcon size={16}/> Profile
                      </button>
                      <button
                        onClick={() => { setOpen(false); logout(); nav("/"); }}
                        className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-left text-rose-400 flex items-center gap-2"
                      >
                        <LogOut size={16}/> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
