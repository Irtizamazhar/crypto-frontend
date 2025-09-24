import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthAPI } from "../services/auth";
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

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(localStorage.getItem("remember_email") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("remember_email"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (rememberMe && email) localStorage.setItem("remember_email", email);
    if (!rememberMe) localStorage.removeItem("remember_email");
  }, [rememberMe, email]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); 
    setBusy(true);
    
    try {
      const u = await login(email.trim(), password);
      if (u) nav("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "Login failed. Please check your credentials.");
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
        title="Sign in" 
        subtitle="Welcome back! Please enter your details."
      >
        <ErrorMessage message={err} />

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
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
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          </div>

          <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="accent-indigo-600 w-4 h-4 rounded focus:ring-2 focus:ring-indigo-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/auth/forgot" className="text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors text-center sm:text-right">
              Forgot password?
            </Link>
          </div>

          <SubmitButton busy={busy}>
            <span className="inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </span>
          </SubmitButton>
        </form>

        <SocialLoginButtons />

        <div className="px-6 sm:px-8 py-6 bg-slate-900/60 border-t border-white/5 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8">
          <p className="text-center text-slate-400 text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}