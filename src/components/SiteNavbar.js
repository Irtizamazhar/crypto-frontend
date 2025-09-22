import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, BarChart3, Rss, Star, Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
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

function UserMenu() {
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
      <button
        onClick={() => nav("/login")}
        className="rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm"
      >
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
      >
        <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold">
          {init}
        </span>
        <ChevronDown size={16}/>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-slate-900 shadow-lg">
          <button
            onClick={() => { setOpen(false); nav("/profile"); }}
            className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2"
          >
            <UserIcon size={16}/> Profile
          </button>
          <button
            onClick={() => { setOpen(false); logout(); nav("/"); }}
            className="w-full px-3 py-2 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2"
          >
            <LogOut size={16}/> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const { _count } = useLoading();

  return (
    <header className="sticky top-0 z-[60]">
      <LoaderBar active={_count > 0} />
      <div className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
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

          <nav className="hidden md:flex items-center gap-2 text-sm ml-4">
            <NavLink to="/" end className="px-4 py-2 hover:bg-white/5 rounded flex items-center gap-2">
              <BarChart3 size={18}/> Market
            </NavLink>
            <NavLink to="/feed" className="px-4 py-2 hover:bg-white/5 rounded flex items-center gap-2">
              <Rss size={18}/> Feed
            </NavLink>
            <NavLink to="/watchlist" className="px-4 py-2 hover:bg-white/5 rounded flex items-center gap-2">
              <Star size={18}/> Watchlist
            </NavLink>
            <NavLink to="/alerts" className="px-4 py-2 hover:bg-white/5 rounded flex items-center gap-2">
              <Bell size={18}/> Alerts
            </NavLink>
          </nav>

          <div className="hidden md:block flex-1 max-w-md ml-auto">
            <SearchBar variant="nav" placeholder="Search cryptocurrencies…" />
          </div>

          <UserMenu />

          <button className="md:hidden" onClick={() => setOpen(v => !v)}>
            {open ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </div>
    </header>
  );
}
