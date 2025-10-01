import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Withdrawal({ onClose }) {
  const { user, getTrc20Wallet } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    amount: "",
    address: "",
    note: ""
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.address) {
      setError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount < 10) {
      setError("Minimum withdrawal amount is 10 USDT");
      return;
    }

    if (amount > (wallet?.usdt || 0)) {
      setError("Insufficient USDT balance");
      return;
    }

    try {
      setWithdrawing(true);
      setError("");
      setSuccess("");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Withdrawal request for ${amount} USDT has been submitted successfully!`);
      setFormData({ amount: "", address: "", note: "" });
      
    } catch (err) {
      setError(err.message || "Withdrawal failed. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const setMaxAmount = () => {
    if (wallet?.usdt) {
      const maxAmount = Math.max(0, wallet.usdt - 1); // Account for fee
      setFormData(prev => ({
        ...prev,
        amount: maxAmount.toFixed(2)
      }));
    }
  };

  return (
    <div className="glass p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-6 max-h-[85vh] overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-rose-400">Withdraw USDT</h2>
          <p className="text-slate-400 text-sm mt-1">Transfer USDT to your external wallet</p>
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

      {success && (
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-700">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-xl p-4 border border-rose-500/20">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-slate-400 text-sm">Available Balance</div>
            <div className="text-3xl font-bold text-rose-400 mt-1">
              {typeof wallet?.usdt === 'number' ? wallet.usdt.toFixed(2) : '0.00'} USDT
            </div>
          </div>
          <div className="text-slate-400 text-xs text-right">
            <div>Min: 10 USDT</div>
            <div>Fee: 1 USDT</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400"></div>
          <div className="text-slate-400 mt-2">Loading wallet information...</div>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-slate-300 font-medium mb-2 block">Amount (USDT) *</label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="10"
                max={wallet?.usdt || 0}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors text-lg font-medium"
                required
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs text-white font-medium transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="text-slate-400 text-xs mt-1">Minimum withdrawal: 10 USDT</div>
          </div>

          {/* Address Input */}
          <div>
            <label className="text-slate-300 font-medium mb-2 block">Recipient Address (TRC20) *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter TRC20 USDT address"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-mono text-sm"
              required
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="text-slate-300 font-medium mb-2 block">Note (Optional)</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="Add a note for this withdrawal"
              rows="3"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={withdrawing || !wallet?.usdt || wallet.usdt < 10}
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:hover:scale-100 hover:scale-105"
          >
            {withdrawing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Withdrawal...
              </>
            ) : (
              "Withdraw USDT"
            )}
          </button>
        </form>
      )}

      {/* Information */}
      <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-600">
        <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Withdrawal Information
        </h3>
        <ul className="text-slate-400 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-rose-400 mt-1">•</span>
            <span>Minimum withdrawal: <strong className="text-rose-300">10 USDT</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 mt-1">•</span>
            <span>Withdrawal fee: <strong className="text-rose-300">1 USDT</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 mt-1">•</span>
            <span>Processing time: 1-24 hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 mt-1">•</span>
            <span>Ensure recipient address supports TRC20 USDT</span>
          </li>
        </ul>
      </div>

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