import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Wallets from "../components/Wallets";
import Deposit from "../components/Deposit";
import Withdrawal from "../components/Withdrawal";
import { PaperAPI } from "../services/paper";

export default function Dashboard() {
  const { user, getTrc20Wallet } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [paperBalance, setPaperBalance] = useState(0);
  const [fiatBalance, setFiatBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    async function fetchWalletData() {
      try {
        setLoading(true);
        
        const walletData = await getTrc20Wallet();
        setWallet(walletData);
        
        const paperData = await PaperAPI.wallet();
        setPaperBalance(Number(paperData.paper || 0));
        setFiatBalance(Number(paperData.fiatUsd || 0));
        setStreak(Number(paperData.streak || 0));
        
        const lastClaimAt = paperData.lastClaimAt ? new Date(paperData.lastClaimAt) : null;
        const now = new Date();
        const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const lastUTC = lastClaimAt ? Date.UTC(lastClaimAt.getUTCFullYear(), lastClaimAt.getUTCMonth(), lastClaimAt.getUTCDate()) : null;
        setClaimedToday(lastUTC === todayUTC);
        
        setError("");
      } catch (err) {
        console.error("Failed to load wallet:", err);
        setError(err.message || "Failed to load wallet information");
        setWallet({
          address: "Address not available",
          usdt: 0,
          error: err.message
        });
        setPaperBalance(0);
        setFiatBalance(0);
        setStreak(0);
        setClaimedToday(false);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchWalletData();
    }
  }, [getTrc20Wallet, user]);

  const claimDaily = async () => {
    try {
      setClaiming(true);
      const result = await PaperAPI.claimDaily();
      setPaperBalance(result.paper || 0);
      setStreak(result.streak || 0);
      setClaimedToday(true);
    } catch (error) {
      console.error("Failed to claim daily reward:", error);
      setError("Failed to claim daily reward");
    } finally {
      setClaiming(false);
    }
  };

  const formatPaper = (v) => `${Number(v || 0).toLocaleString()} P`;

  const openModal = (modalType) => {
    setActiveModal(modalType);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = 'unset'; // Re-enable scrolling
    refreshWalletData();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  useEffect(() => {
    if (activeModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [activeModal]);

  const refreshWalletData = async () => {
    try {
      const walletData = await getTrc20Wallet();
      setWallet(walletData);
      
      const paperData = await PaperAPI.wallet();
      setPaperBalance(Number(paperData.paper || 0));
      setFiatBalance(Number(paperData.fiatUsd || 0));
    } catch (error) {
      console.error("Error refreshing wallet data:", error);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-white text-center">
        <div className="glass p-6 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-slate-400 mb-4">You need to be logged in to view your dashboard.</p>
          <Link to="/login" className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-xl px-4 py-8 space-y-6 text-white">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {error && (
          <div className="glass p-4 rounded-xl bg-red-900/20 border border-red-700">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <div className="glass p-4 rounded-xl bg-slate-800 border border-slate-700">
          <div className="text-slate-400 text-sm">Welcome</div>
          <div className="text-2xl font-bold">{user?.name}</div>
          <div className="text-slate-300 text-sm mt-1">{user?.email}</div>
        </div>
        
        <Wallets
          isAuthed={!!user}
          paper={paperBalance}
          fiatUsd={fiatBalance}
          streak={streak}
          claimedToday={claimedToday}
          claiming={claiming}
          claimDaily={claimDaily}
          fmtPaper={formatPaper}
          trc20Address={wallet?.address}
        />
        
        {loading ? (
          <div className="glass p-4 rounded-xl bg-slate-800 border border-slate-700 text-center">
            <div className="text-slate-400">Loading wallet information...</div>
          </div>
        ) : wallet && (
          <div className="glass p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
            <div className="text-slate-400 text-sm font-semibold">USDT Wallet Details</div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-slate-400 text-xs">USDT Balance</div>
                <div className="text-slate-200 text-xl font-semibold">
                  {typeof wallet.usdt === 'number' ? wallet.usdt.toFixed(2) : '0'} USDT
                </div>
                <div className="text-slate-400 text-xs mt-2">
                  Available for trading and withdrawals
                </div>
              </div>
            </div>
            
            {wallet.error && (
              <div className="text-yellow-400 text-xs mt-2 p-2 bg-yellow-900/20 rounded">
                Note: Blockchain data might be temporarily unavailable
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => openModal('deposit')}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-semibold"
          >
            Deposit USDT
          </button>
          <button 
            onClick={() => openModal('withdraw')}
            className="px-6 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors font-semibold"
          >
            Withdraw USDT
          </button>
        </div>

        <div className="glass p-4 rounded-xl bg-slate-800 border border-slate-700">
          <div className="text-slate-400 text-sm font-semibold mb-2">Wallet Information</div>
          <div className="text-slate-300 text-sm space-y-2">
            <p>• Paper is earned through daily rewards, referrals, and activities</p>
            <p>• USDT (TRC20) is used for real trading and withdrawals</p>
            <p>• Deposit USDT to your TRC20 address to start trading</p>
            <p>• Minimum withdrawal amount: 10 USDT</p>
            <p>• Withdrawals are processed within 24 hours</p>
          </div>
        </div>
      </div>

      {/* Modal Overlays */}
      {activeModal === 'deposit' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleBackdropClick}
        >
          <div className="relative w-full max-w-md animate-scaleIn">
            <Deposit onClose={closeModal} />
          </div>
        </div>
      )}

      {activeModal === 'withdraw' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleBackdropClick}
        >
          <div className="relative w-full max-w-md animate-scaleIn">
            <Withdrawal onClose={closeModal} />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}