import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Deposit({ onClose }) {
  const { user, getTrc20Wallet } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWallet() {
      try {
        setLoading(true);
        const walletData = await getTrc20Wallet();
        setWallet(walletData);
        setError("");
      } catch (err) {
        console.error("Failed to load wallet:", err);
        setError(err.message || "Failed to load wallet information");
        setWallet({
          address: "Address not available",
          usdt: 0,
          error: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchWallet();
    }
  }, [getTrc20Wallet, user]);

  const handleCopyAddress = async () => {
    if (!wallet?.address || wallet.address === "Address not available") return;
    
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-6 max-h-[85vh] overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400">Deposit USDT</h2>
          <p className="text-slate-400 text-sm mt-1">Send USDT to your TRC20 address</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors hover:scale-110 transform duration-200"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-700">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
        <div className="text-slate-400 text-sm">Available Balance</div>
        <div className="text-3xl font-bold text-emerald-400 mt-1">
          {typeof wallet?.usdt === 'number' ? wallet.usdt.toFixed(2) : '0.00'} USDT
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <div className="text-slate-400 mt-2">Loading deposit address...</div>
        </div>
      ) : (
        <>
          {/* Deposit Address Section */}
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-medium mb-3 block text-lg">Deposit Address (TRC20)</label>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <div className="text-sm font-mono text-slate-200 break-all bg-slate-800/50 p-3 rounded-lg">
                  {wallet?.address || "Address not available"}
                </div>
                <button
                  onClick={handleCopyAddress}
                  disabled={!wallet?.address || wallet.address === "Address not available"}
                  className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    copied 
                      ? "bg-green-600 text-white scale-95" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105"
                  } disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100`}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Address Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Address
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-600">
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Important Instructions
            </h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Only send <strong className="text-emerald-300">USDT (TRC20)</strong> to this address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Do not send other cryptocurrencies or from other networks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Deposits typically take 1-5 minutes to confirm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Minimum deposit: <strong className="text-emerald-300">1 USDT</strong></span>
              </li>
            </ul>
          </div>

          {wallet?.error && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Note: {wallet.error}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}