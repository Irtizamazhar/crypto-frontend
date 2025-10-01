import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle, Send, Tag, Link as LinkIcon, X, Eye, Verified
} from "lucide-react";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const avatar = (seed) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
    String(seed || "user")
  )}`;

const SUGGESTED_COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","MATIC","LINK","DOT","LTC"];
const TRENDING_TOPICS = ["Bitcoin ETF", "Ethereum Upgrade", "DeFi Summer", "NFT Market", "Web3 Gaming", "Layer 2"];

export default function CreatePostModal({ open, onClose, onSubmit, FeedAPI }) {
  const [text, setText] = useState("");
  const [coin, setCoin] = useState("");
  const [url, setUrl] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [postType, setPostType] = useState("post");
  const [loading, setLoading] = useState(false);

  const charCount = text.length;
  const canPost = text.trim().length > 0 && charCount <= 1000;

  // reset on close
  useEffect(() => {
    if (!open) {
      setText("");
      setCoin("");
      setUrl("");
      setSentiment("");
      setPostType("post");
      setLoading(false);
    }
  }, [open]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = async () => {
    if (!canPost || loading) return;
    setLoading(true);
    try {
      const payload = {
        type: postType,
        text: text.trim(),
        coin: coin.trim().toUpperCase() || undefined,
        url: url.trim() || undefined,
        sentiment: sentiment || undefined,
      };
      const { id } = await FeedAPI.create(payload);
      onSubmit?.({
        id,
        ...payload,
        reactions: { like: 0, rocket: 0, fire: 0, think: 0 },
        comment_count: 0,
        ts: Date.now(),
        user: "You",
        user_id: 1,
        views: 0,
        canDelete: true,
      });
      onClose?.();
    } catch (e) {
      alert("Failed to post: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-700/60 bg-[linear-gradient(180deg,rgba(18,24,38,.9),rgba(18,24,38,.86))]"
      >
        {/* Header (polished) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 ring-1 ring-white/10 shadow-md shadow-purple-500/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-[0.2px] text-white">
                Create a Post
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Share signals, setups, or news with the community.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Segmented type */}
          <div className="inline-grid grid-cols-3 rounded-xl border border-gray-700/60 bg-gray-900/40 p-1">
            {[
              { value: "post", label: "Discussion" },
              { value: "news", label: "News" },
              { value: "trade", label: "Trade Idea" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setPostType(t.value)}
                className={cls(
                  "px-3 py-2 text-sm rounded-lg transition-all",
                  postType === t.value
                    ? "bg-gradient-to-r from-purple-500/25 to-blue-500/25 text-blue-200 shadow-inner ring-1 ring-white/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* User row */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-700/50 bg-gray-800/30">
            <img
              src={avatar("you")}
              alt="You"
              className="w-12 h-12 rounded-2xl border-2 border-purple-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">You</span>
                <Verified className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xs text-gray-400">
                Posting to <span className="text-gray-300">CryptoAlpha</span>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                postType === "news"
                  ? "📰 Share breaking crypto news or analysis…"
                  : postType === "trade"
                  ? "📊 Describe your setup, entry, risk, targets…"
                  : "💬 Share market insights, alpha, or questions…"
              }
              maxLength={1000}
              className="w-full min-h-[9rem] p-4 rounded-2xl border-2 border-gray-700/70 bg-gray-900/40 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-[15px] leading-relaxed"
            />
            <div
              className={cls(
                "absolute bottom-3 right-3 text-[11px] font-medium px-2 py-1 rounded-full",
                text.length > 900
                  ? "text-red-300 bg-red-500/20"
                  : "text-gray-400 bg-gray-700/50"
              )}
            >
              {charCount}/1000
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Asset
              </label>
              <input
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                placeholder="BTC, ETH, SOL…"
                list="coins-suggest"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-700/70 bg-gray-900/40 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
              <datalist id="coins-suggest">
                {SUGGESTED_COINS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Sentiment
              </label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-700/70 bg-gray-900/40 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              >
                <option value="">How are you feeling?</option>
                <option value="bullish">🐂 Extremely Bullish</option>
                <option value="bearish">🐻 Bearish</option>
                <option value="neutral">⚖️ Neutral</option>
              </select>
            </div>

            {postType === "news" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Source URL
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-700/70 bg-gray-900/40 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.slice(0, 4).map((t) => (
              <button
                key={t}
                onClick={() =>
                  setText((prev) => prev + ` #${t.replace(/\s+/g, "")}`)
                }
                className="px-3 py-2 rounded-lg border border-gray-600/70 bg-gray-800/40 text-gray-300 hover:text-white hover:bg-gray-700/40 transition text-sm"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-700/50 bg-gray-900/40">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Visible to everyone
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canPost || loading}
              className={cls(
                "flex items-center gap-2 px-7 py-3 rounded-xl font-semibold shadow-lg transition",
                canPost && !loading
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
