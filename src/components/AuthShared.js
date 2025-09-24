import React from "react";
import { Link } from "react-router-dom";

/* ---------- Shared FX Styles ---------- */
export const FXStyles = () => (
  <style>{`
    .auth-grid {
      background-image:
        radial-gradient(1200px 600px at -20% -10%, rgba(99,102,241,0.22), rgba(2,6,23,0) 60%),
        radial-gradient(900px 500px at 120% 110%, rgba(168,85,247,0.18), rgba(2,6,23,0) 60%),
        linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(5,10,25,1) 70%, rgba(7,11,28,1) 100%),
        linear-gradient(transparent 0, transparent 31px, rgba(255,255,255,.06) 31px),
        linear-gradient(90deg, transparent 0, transparent 31px, rgba(255,255,255,.06) 31px);
      background-size:
        auto, auto, auto,
        32px 32px,
        32px 32px;
      background-position:
        center, center, center,
        0 0, 0 0;
    }
    .orb {
      position:absolute;width:28rem;height:28rem;border-radius:9999px;filter:blur(40px);
      opacity:.35;mix-blend:screen;pointer-events:none;
      background: radial-gradient(closest-side, rgba(99,102,241,.55), transparent 70%);
      animation: float 16s ease-in-out infinite;
    }
    .orb.orb-2 { background: radial-gradient(closest-side, rgba(168,85,247,.45), transparent 70%); animation-duration: 18s; }
    .orb.orb-3 { background: radial-gradient(closest-side, rgba(56,189,248,.4), transparent 70%); animation-duration: 20s; }

    @keyframes float {
      0%,100% { transform: translateY(0px) translateX(0px) scale(1); }
      50% { transform: translateY(-24px) translateX(10px) scale(1.02); }
    }

    .glass { background: rgba(15,23,42,0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
    .neon-border { position: absolute; inset: -1px; border-radius: 1rem; background: linear-gradient(90deg, rgba(59,130,246,.0), rgba(59,130,246,.5), rgba(168,85,247,.5), rgba(236,72,153,.0)); filter: blur(10px); opacity: .25; transition: opacity .4s ease; }
    .group:hover .neon-border { opacity: .55; }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .auth-grid {
        background-size: auto, auto, auto, 24px 24px, 24px 24px;
      }
      .mobile-padding {
        padding: 1rem;
      }
    }
  `}</style>
);

/* ---------- Stars Background ---------- */
export const StarsBackground = () => (
  <div className="pointer-events-none absolute inset-0">
    {[...Array(12)].map((_, i) => ( // Reduced for mobile performance
      <span
        key={i}
        className="absolute w-1 h-1 rounded-full bg-white/30 animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      />
    ))}
  </div>
);

/* ---------- Reused Left Panel ---------- */
export function AuthSideArt() {
  return (
    <div className="relative hidden lg:flex w-1/2 items-center justify-center">
      {/* glow orbs */}
      <div className="orb -top-10 -left-16" />
      <div className="orb orb-2 -bottom-16 -right-10" />
      <div className="orb orb-3 top-24 right-40" />

      {/* nudge content slightly toward center */}
      <div className="relative z-10 text-center px-8 lg:translate-x-6">
        <img
          src="/images/main-image-sign-in.png"
          alt="Learn • Trade • Earn"
          className="w-full max-w-md mx-auto mb-8 transition-transform duration-700 hover:scale-[1.03] drop-shadow-2xl"
        />
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-indigo-300 bg-clip-text text-transparent">
            Welcome to CryptoSense
          </h2>
          <p className="text-blue-100/80 text-lg max-w-md mx-auto leading-relaxed">
            Access your personalized crypto dashboard and trade with confidence using advanced analytics.
          </p>
          <div className="flex justify-center gap-8 pt-4">
            {[
              { k: "100K+", v: "Active Traders" },
              { k: "$2.5B+", v: "Volume Traded" },
              { k: "99.9%", v: "Uptime" },
            ].map((m) => (
              <div key={m.v} className="text-center">
                <div className="text-2xl font-bold text-white">{m.k}</div>
                <div className="text-blue-200/70 text-sm">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* faint decorative bg image */}
      <img
        src="/images/image-crypto.png"
        alt=""
        className="pointer-events-none select-none absolute -bottom-12 -right-10 w-[520px] opacity-15"
      />
    </div>
  );
}

/* ---------- Password Input Component ---------- */
export function PasswordInput({ value, onChange, placeholder = "••••••••", showPassword, setShowPassword }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.943 0 1.839.186 2.652.525a3 3 0 10-5.304 0A8.963 8.963 0 0112 11z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </span>
      <input
        className="w-full pl-10 pr-12 py-3.5 rounded-lg bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m3.29 3.29l3.29 3.29" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ---------- Social Login Buttons ---------- */
export function SocialLoginButtons() {
  const socialProviders = [
    { 
      name: "Google", 
      url: "/auth/google", 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    { 
      name: "Facebook", 
      url: "/auth/facebook", 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    { 
      name: "Apple", 
      url: "/auth/apple", 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="mt-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 text-slate-400 bg-slate-900 text-xs">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {socialProviders.map((provider) => (
          <a
            key={provider.name}
            href={provider.url}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {provider.icon}
            <span className="hidden sm:inline text-sm font-medium">{provider.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------- Auth Card Container ---------- */
export function AuthCard({ children, title, subtitle }) {
  return (
    <div className="relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-10 mobile-padding">
      <div className="w-full max-w-md">
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">CryptoSense</span>
          </div>
        </div>

        <div className="relative group">
          <div className="neon-border rounded-2xl" />
          <div className="glass rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white text-center">{title}</h1>
              <p className="text-slate-400 text-sm mt-1 text-center">{subtitle}</p>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Submit Button ---------- */
export function SubmitButton({ busy, children, disabled = false }) {
  return (
    <button
      className="w-full py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      disabled={busy || disabled}
      type="submit"
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* ---------- Error Message ---------- */
export function ErrorMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="mt-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 animate-pulse">
      {message}
    </div>
  );
}