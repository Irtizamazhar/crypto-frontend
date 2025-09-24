// src/components/SiteNavbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, BarChart3, Rss, Star, Bell, ChevronDown,
  LogOut, User as UserIcon
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

/* ---------------- Desktop dropdown menu ---------------- */
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

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => nav("/login")}
        className="rounded-lg px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        Sign In
      </motion.button>
    );
  }

  const name = user.name || user.email || "User";
  const init = initialsFromName(name);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); }
          if (e.key === "Escape") setOpen(false);
        }}
        className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-sm hover:bg-white/[0.10] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="desktop-user-menu"
      >
        <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold shadow-lg">
          {init}
        </span>
        <ChevronDown size={16} className={`text-slate-200 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="desktop-user-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[70] overflow-hidden"
            role="menu"
          >
            <div className="p-3 border-b border-white/10">
              <div className="text-sm font-medium text-white truncate">{name}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => { setOpen(false); nav("/profile"); }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 transition-colors duration-150 text-slate-200"
              role="menuitem"
            >
              <UserIcon size={18} className="text-indigo-400"/>
              <span>Profile</span>
            </button>
            <button
              onClick={() => { setOpen(false); logout(); nav("/"); }}
              className="w-full px-4 py-3 text-left text-rose-400 hover:bg-rose-400/10 flex items-center gap-3 transition-colors duration-150"
              role="menuitem"
            >
              <LogOut size={18} className="text-rose-400"/>
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Compact user button for mobile ---------------- */
function UserButtonCompact() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => nav("/login")}
        className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-white/20 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label="Sign in"
        title="Sign in"
      >
        <UserIcon size={18}/>
      </motion.button>
    );
  }
  const init = initialsFromName(user.name || user.email);
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => nav("/profile")}
      className="h-10 w-10 grid place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      aria-label="Profile"
      title="Profile"
    >
      {init}
    </motion.button>
  );
}

/* ---------------- Main Navbar ---------------- */
export default function SiteNavbar() {
  const [open, setOpen] = useState(false);             // mobile menu open
  const { _count } = useLoading();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  // close menu on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  // ESC closes menu
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // lock body scroll when menu is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  const NavItem = ({ to, icon, label, onClick }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-4 py-3.5 rounded-xl flex items-center gap-3 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
          isActive
            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-400/30 shadow-md"
            : "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent"
        }`
      }
    >
      {icon} <span className="leading-none text-base">{label}</span>
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-[70]">
      <LoaderBar active={_count > 0} />

      {/* Fixed height nav row so content never hides behind it */}
      <div className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl supports-backdrop-blur:bg-slate-950/80 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 md:h-16 flex items-center gap-3 sm:gap-4 [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
          {/* Logo — nudged slightly right with ml */}
          <NavLink to="/" className="flex items-center gap-3 flex-shrink-0 ml-1">
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 grid place-items-center shadow-xl border-2 border-white/20"
            >
              <img
                src="/images/coin-logo.png"
                alt="CryptoSense Logo"
                className="h-6 w-6 md:h-8 md:w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.style.display = "block";
                }}
              />
              <span className="font-black text-white text-lg md:text-xl hidden">₿</span>
            </motion.div>
            <div className="block">
              <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                CryptoSense
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 -mt-0.5 sm:-mt-1 font-medium hidden sm:block">
                Analyze • Decide • Win
              </div>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm ml-2 lg:ml-4">
            <NavItem to="/"          icon={<BarChart3 size={18} className="text-indigo-400" />} label="Market" />
            <NavItem to="/feed"      icon={<Rss size={18} className="text-green-400" />}      label="Feed" />
            <NavItem to="/watchlist" icon={<Star size={18} className="text-yellow-400" />}     label="Watchlist" />
            <NavItem to="/alerts"    icon={<Bell size={18} className="text-red-400" />}        label="Alerts" />
          </nav>

          {/* spacer */}
          <div className="flex-1" />

          {/* Desktop search + user */}
          <div className="hidden md:block max-w-md w-full mx-2 lg:mx-4">
            <SearchBar variant="nav" placeholder="Search cryptocurrencies…" />
          </div>
          <div className="hidden md:block">
            <UserMenuDesktop />
          </div>

          {/* Mobile cluster: user, hamburger (search icon removed) */}
          <div className="md:hidden flex items-center gap-2 mr-1">
            <UserButtonCompact />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen((v) => v ? false : true)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="h-10 w-10 grid place-items-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 -mr-1"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* --------- Mobile menu: full-screen sheet below the header --------- */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[66] bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            {/* Sheet */}
            <motion.div
              id="mobile-menu"
              key="menu-sheet"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeInOut" }}
              className="fixed inset-x-0 top-0 z-[67] pt-[56px] md:pt-[64px] [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]"
              role="dialog"
              aria-modal="true"
            >
              <div className="max-h-[calc(100vh-56px)] md:max-h-[calc(100vh-64px)] overflow-y-auto bg-slate-900/98 backdrop-blur-xl border-b border-white/10 rounded-b-2xl">
                <div className="px-4 py-4 space-y-4">
                  {/* user summary */}
                  {user && (
                    <div className="px-3 py-3 border border-white/10 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                      <div className="text-sm font-medium text-white truncate">{user.name || user.email}</div>
                      <div className="text-xs text-slate-300">Welcome back!</div>
                    </div>
                  )}

                  {/* nav items */}
                  <div className="grid gap-2">
                    <NavItem to="/"          icon={<BarChart3 size={22} className="text-indigo-400" />} label="Market Dashboard" onClick={() => setOpen(false)} />
                    <NavItem to="/feed"      icon={<Rss size={22} className="text-green-400" />}       label="News Feed"       onClick={() => setOpen(false)} />
                    <NavItem to="/watchlist" icon={<Star size={22} className="text-yellow-400" />}      label="My Watchlist"    onClick={() => setOpen(false)} />
                    <NavItem to="/alerts"    icon={<Bell size={22} className="text-red-400" />}        label="Price Alerts"    onClick={() => setOpen(false)} />
                  </div>

                  {/* actions */}
                  <div className="pt-2 border-t border-white/10">
                    {!user ? (
                      <div className="grid gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setOpen(false); nav("/login"); }}
                          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3.5 font-medium shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 text-base"
                        >
                          Sign In to CryptoSense
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setOpen(false); nav("/register"); }}
                          className="w-full rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 px-4 py-3.5 font-medium hover:bg-indigo-500/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 text-base"
                        >
                          Create Account
                        </motion.button>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <button
                          onClick={() => { setOpen(false); nav("/profile"); }}
                          className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-left flex items-center gap-3 hover:bg-white/10 transition-colors duration-200 text-base"
                        >
                          <UserIcon size={20} className="text-indigo-400"/>
                          <span className="font-medium">My Profile</span>
                        </button>
                        <button
                          onClick={() => { setOpen(false); logout(); nav("/"); }}
                          className="w-full px-4 py-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-left text-rose-300 flex items-center gap-3 hover:bg-rose-500/20 transition-colors duration-200 text-base"
                        >
                          <LogOut size={20} className="text-rose-400"/>
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-center text-xs text-slate-500 pb-1">
                      CryptoSense v1.0 • Your Crypto Companion
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
