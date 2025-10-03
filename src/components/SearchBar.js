import React, { useEffect, useRef, useState } from "react";
import { searchCoins } from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import CoinIcon from "./CoinIcon";

export default function SearchBar({
  variant = "nav",
  placeholder = "Search any coin..."
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const nav = useNavigate();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // debounced, abortable fetch
  useEffect(() => {
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }

    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) { setRes([]); setLoading(false); setActive(-1); return; }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);

      try {
        const payload = await searchCoins(query, { signal: ctrl.signal });
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.coins) ? payload.coins : []);
        setRes(list.slice(0, 10));
        setActive(-1);
      } catch (e) {
        if (e?.name !== "AbortError") { console.error("search error:", e); setRes([]); }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    };
  }, [q]);

  // close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const go = (id) => {
    if (!id) return;
    setOpen(false);
    setQ("");
    setRes([]);
    nav(`/trade/${encodeURIComponent(id)}`); // same destination as CoinCard
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(res.length - 1, 0))); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      if (active >= 0 && res[active]) go(res[active].id);
      else if (res[0]) go(res[0].id);
    }
  };

  const sizeClass  = variant === "nav" ? "h-10" : "h-12";
  const widthClass = variant === "nav" ? "w-full" : "w-full md:w-[28rem]";
  const zClass     = "z-[80]";

  return (
    <div ref={wrapRef} className={`relative ${widthClass}`}>
      <div
        className={`flex items-center gap-2 glass px-3 ${sizeClass}`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 placeholder:text-slate-500"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-results"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setActive(-1); inputRef.current?.focus(); }}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {/* results */}
      <AnimatePresence>
        {open && res.length > 0 && (
          <motion.ul
            id="search-results"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute mt-2 left-0 right-0 glass p-2 divide-y divide-white/5 ${zClass}`}
          >
            {res.map((c, i) => {
              const isActive = i === active;
              const symbolU = String(c.symbol || "").toUpperCase();
              return (
                <li key={c.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(-1)}
                    onClick={() => go(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      isActive ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <CoinIcon
                      coin={{ id: c.id, symbol: c.symbol, image: c.thumb }}
                      symbol={c.symbol || c.id}
                      size={20}
                      rounded="full"
                      className="shrink-0"
                    />
                    <span className="flex-1 truncate">
                      {c.name} <span className="text-slate-400">({symbolU})</span>
                    </span>
                    <span className="text-indigo-400 text-xs">Open</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
