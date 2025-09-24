import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FXStyles, 
  StarsBackground, 
  AuthSideArt, 
  PasswordInput, 
  SocialLoginButtons, 
  AuthCard, 
  SubmitButton, 
  ErrorMessage 
} from "../components/AuthShared";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    
    if (!agree) {
      setErr("Please accept Terms & Privacy to continue.");
      return;
    }

    setBusy(true);
    try {
      const u = await register(name.trim(), email.trim(), password);
      if (u) nav("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen relative grid lg:grid-cols-2 auth-grid overflow-hidden">
      <FXStyles />
      <StarsBackground />

      {/* Left: Art - Hidden on mobile */}
      <AuthSideArt />

      {/* Right: Form */}
      <AuthCard 
        title="Create your account" 
        subtitle="Join us and start learning & earning"
      >
        <ErrorMessage message={err} />

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Full name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Satoshi Nakamoto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm sm:text-base"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <PasswordInput 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Use 8+ characters with a mix of letters, numbers & symbols.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded accent-indigo-600 focus:ring-2 focus:ring-indigo-500"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-xs sm:text-sm">
              I agree to the{" "}
              <Link to="/terms" className="text-indigo-300 hover:text-indigo-200 transition-colors">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-indigo-300 hover:text-indigo-200 transition-colors">Privacy Policy</Link>.
            </span>
          </label>

          <SubmitButton busy={busy} disabled={!agree}>
            Create account
          </SubmitButton>
        </form>

        <SocialLoginButtons />

        <div className="mt-7 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <div className="text-xs text-slate-400">Already have an account?</div>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 transition-all duration-200 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}