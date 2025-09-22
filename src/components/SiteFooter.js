import React from "react";
import { NavLink } from "react-router-dom";
import { Github, Twitter, Mail, ChevronRight } from "lucide-react";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16">
      {/* CTA Banner */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 sm:p-7 shadow-[0_0_60px_-25px_rgba(34,211,238,.45)]">
          {/* subtle lights */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Join the CryptoSense community
              </h3>
              <p className="text-sm text-slate-400">
                Share insights on the Feed and earn Paper while you learn.
              </p>
            </div>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
              <NavLink
                to="/feed"
                className="group inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-cyan-600/90 hover:bg-cyan-600 transition"
              >
                Open Feed
                <ChevronRight size={16} className="ml-1 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </NavLink>
              <NavLink
                to="/paper"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                Earn Paper
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Body */}
      <div className="mt-8 border-t border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md" aria-hidden />
              <span className="text-lg font-extrabold tracking-tight">CryptoSense</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Pro tools for scanning markets, learning strategies, and tracking your progress — all in one place.
            </p>
            <div className="mt-4 flex items-center gap-3 text-slate-300">
              <a className="rounded-lg p-2 bg-white/5 hover:bg-white/10 border border-white/10" href="#" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a className="rounded-lg p-2 bg-white/5 hover:bg-white/10 border border-white/10" href="#" aria-label="GitHub">
                <Github size={16} />
              </a>
              <a className="rounded-lg p-2 bg-white/5 hover:bg-white/10 border border-white/10" href="mailto:hello@cryptosense.app" aria-label="Email">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* App links */}
          <div>
            <div className="text-sm font-semibold mb-3 text-slate-300">App</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><NavLink className="hover:text-slate-200" to="/">Market</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/signals">Signals</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/portfolio">Paper Trading</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/game">$1 Game</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/paper">Earn Paper</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/feed">Feed</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/watchlist">Watchlist</NavLink></li>
              <li><NavLink className="hover:text-slate-200" to="/alerts">Alerts</NavLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="text-sm font-semibold mb-3 text-slate-300">Resources</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a className="hover:text-slate-200" href="#">Docs</a></li>
              <li><a className="hover:text-slate-200" href="#">Roadmap</a></li>
              <li><a className="hover:text-slate-200" href="#">Changelog</a></li>
              <li><a className="hover:text-slate-200" href="#">Support</a></li>
            </ul>
          </div>

          {/* Legal / small print */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Heads up</div>
            <p className="mt-1 text-xs text-slate-400">
              Data is for education and research. Nothing here is financial advice.
            </p>
            <div className="mt-3 text-xs text-slate-500">© {year} CryptoSense</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
