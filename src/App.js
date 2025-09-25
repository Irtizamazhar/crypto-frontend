// src/App.js
import React, { Suspense, lazy, useState, useContext, createContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { WatchlistProvider } from "./context/WatchlistContext";
import { LoadingProvider } from "./context/LoadingContext";
import { AlertsProvider } from "./context/AlertsContext";
import { ToastProvider, useToast } from "./components/ToastHub";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PortfolioProvider } from "./context/PortfolioContext"; 

// Layouts
import SiteLayout from "./layouts/SiteLayout";

// Pages
const Home       = lazy(() => import("./pages/Home"));
const Coin       = lazy(() => import("./pages/Coin"));
const Trade      = lazy(() => import("./pages/Trade"));
const Watchlist  = lazy(() => import("./pages/Watchlist"));
const AlertsPage = lazy(() => import("./pages/Alerts"));
const Signals    = lazy(() => import("./pages/Signals"));
const Backtest   = lazy(() => import("./pages/Backtest"));
const Portfolio  = lazy(() => import("./pages/Portfolio"));
const DollarGame = lazy(() => import("./pages/DollarGame"));
const PaperTap   = lazy(() => import("./pages/PaperTap"));
const Feed       = lazy(() => import("./pages/Feed"));
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Login      = lazy(() => import("./pages/Login"));
const Register   = lazy(() => import("./pages/Register"));
const Profile    = lazy(() => import("./pages/Profile"));

// Admin (separate area)
const AdminDashboard    = lazy(() => import("./pages/admin/Dashboard"));
const AdminLogin        = lazy(() => import("./pages/admin/Login"));
// ✅ Point to the file you actually have: AdminLotteryPanel.js
const AdminLotteryPanel = lazy(() => import("./pages/admin/AdminLotteryPanel"));

/* ---------- Auth modal context ---------- */
const AuthModalContext = createContext({ open: () => {}, close: () => {} });
export const useAuthModal = () => useContext(AuthModalContext);

/* ---------- Modal ---------- */
function SignPromptModal({ open, onClose }) {
  const nav = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-2">Sign in required</h2>
        <p className="text-sm text-slate-400">
          You need an account to continue. Log in or create a new account.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => { onClose(); nav("/login"); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
          >
            Sign in
          </button>
          <button
            onClick={() => { onClose(); nav("/register"); }}
            className="px-4 py-2 rounded-xl bg-white/10 text-white"
          >
            Register
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-slate-400 hover:text-slate-200 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------- Guards ---------- */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const { open } = useAuthModal();
  if (!user) {
    open();
    return <Navigate to="/" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (String(user.role || "").toLowerCase() !== "admin") return <Navigate to="/" replace />;
  return children;
}

/* ---------- app root ---------- */
export default function App() {
  const Providers = ({ children }) => {
    const ToastHook = ({ children }) => {
      const { push } = useToast();
      return <AlertsProvider onToast={(t) => push(t)}>{children}</AlertsProvider>;
    };
    return (
      <AuthProvider>
        <PortfolioProvider>
        <WatchlistProvider>
          <LoadingProvider>
            <ToastProvider>
              <ToastHook>{children}</ToastHook>
            </ToastProvider>
          </LoadingProvider>
        </WatchlistProvider>
        </PortfolioProvider>
      </AuthProvider>
    );
  };

  const [authOpen, setAuthOpen] = useState(false);
  const modalApi = {
    open: () => setAuthOpen(true),
    close: () => setAuthOpen(false),
  };

  return (
    <Providers>
      <AuthModalContext.Provider value={modalApi}>
        <Suspense fallback={<div className="min-h-screen grid place-items-center text-slate-300">Loading…</div>}>
          <Routes>
            {/* ---------- SITE (with navbar/footer) ---------- */}
            <Route element={<SiteLayout />}>
              {/* public */}
              <Route path="/" element={<Home />} />

              {/* protected */}
              <Route path="/signals"   element={<ProtectedRoute><Signals /></ProtectedRoute>} />
              <Route path="/coin/:id"  element={<ProtectedRoute><Coin /></ProtectedRoute>} />
              <Route path="/trade/:id" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
              <Route path="/backtest/:id" element={<ProtectedRoute><Backtest /></ProtectedRoute>} />
              <Route path="/game"      element={<ProtectedRoute><DollarGame /></ProtectedRoute>} />
              <Route path="/paper"     element={<ProtectedRoute><PaperTap /></ProtectedRoute>} />
              <Route path="/feed"      element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
              <Route path="/alerts"    element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* auth pages */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* ---------- ADMIN ---------- */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            {/* ✅ Lottery admin route uses AdminLotteryPanel */}
            <Route path="/admin/lottery" element={<AdminRoute><AdminLotteryPanel /></AdminRoute>} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <SignPromptModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </AuthModalContext.Provider>
    </Providers>
  );
}
