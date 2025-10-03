// src/components/SiteFooter.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Github, Twitter, Mail, ChevronRight, ExternalLink } from "lucide-react";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 overflow-hidden">
      {/* CTA Banner */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/20 p-8 shadow-2xl shadow-cyan-500/10">
          {/* bg effects */}
          <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Join the CryptoSense Community
              </h3>
              <p className="text-sm text-slate-300 max-w-md">
                Share market insights, learn trading strategies, and earn Paper rewards while you grow your crypto knowledge.
              </p>
            </div>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
              <NavLink
                to="/feed"
                className="group inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 hover:scale-105"
              >
                Explore Feed
                <ChevronRight size={18} className="ml-2 opacity-80 group-hover:translate-x-1 transition-transform" />
              </NavLink>
              <NavLink
                to="/paper"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
              >
                Start Earning
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Body */}
      <div className="mt-6 border-t border-white/10 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg flex items-center justify-center">
                <div className="h-6 w-6 rounded bg-white/20" />
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  CryptoSense
                </span>
                <div className="text-xs text-cyan-400 font-medium mt-0.5">PRO TRADING PLATFORM</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Advanced tools for market analysis, strategy development, and portfolio tracking — all designed for crypto enthusiasts.
            </p>
            <div className="flex items-center gap-2">
              <a
                className="rounded-xl p-2.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all duration-200 group"
                href="#"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-slate-400 group-hover:text-cyan-400" />
              </a>
              <a
                className="rounded-xl p-2.5 bg-white/5 hover:bg-slate-500/20 border border-white/10 hover:border-slate-400/30 transition-all duration-200 group"
                href="#"
                aria-label="GitHub"
              >
                <Github size={18} className="text-slate-400 group-hover:text-slate-300" />
              </a>
              <a
                className="rounded-xl p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all duration-200 group"
                href="mailto:hello@cryptosense.app"
                aria-label="Email"
              >
                <Mail size={18} className="text-slate-400 group-hover:text-red-400" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Platform</div>
            <ul className="space-y-3">
              {[
                { name: "Market Scanner", path: "/" },
                { name: "Trading Signals", path: "/signals" },
                { name: "Paper Trading", path: "/portfolio" },
                { name: "$1 Challenge", path: "/game" },
                { name: "Earn Rewards", path: "/paper" },
                { name: "Community Feed", path: "/feed" },
                { name: "Dashboard", path: "/dashboard" },
                { name: "Watchlist", path: "/watchlist" },
                { name: "Price Alerts", path: "/alerts" },
              ].map((item) => (
                <li key={item.name}>
                  <NavLink
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1 group"
                    to={item.path}
                  >
                    {item.name}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Resources</div>
            <ul className="space-y-3">
              {[
                { name: "Documentation", href: "#" },
                { name: "API Reference", href: "#" },
                { name: "Trading Guides", href: "#" },
                { name: "Market Analysis", href: "#" },
                { name: "Community", href: "#" },
                { name: "Support Center", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1 group"
                    href={item.href}
                  >
                    {item.name}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Notice */}
          <div className="col-span-2 lg:col-span-1">
            <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <div className="h-4 w-4 rounded bg-amber-400/60" />
                </div>
                <div className="text-sm font-semibold text-slate-200">Important Notice</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                All market data and tools are provided for educational and research purposes only.
                This is not financial advice. Cryptocurrency trading involves substantial risk.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="text-xs text-slate-500">© {year} CryptoSense Pro</div>
                <div className="flex gap-4">
                  <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Terms</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Privacy</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar (gap fix: reduced padding + safe-area only) */}
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 pt-3 pb-[max(0px,env(safe-area-inset-bottom))]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>Built for crypto enthusiasts</span>
                <div className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Real-time data</span>
                <div className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Professional tools</span>
              </div>
              <div className="flex items-center gap-2">
                <span>v2.1.0</span>
                <div className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Updated recently</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
