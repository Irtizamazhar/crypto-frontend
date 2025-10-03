// src/components/ReferralWidget.jsx
import React, { useEffect, useState } from "react";
import { ReferralAPI } from "../services/referral";

export default function ReferralWidget() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await ReferralAPI.mine();
        setData(r);
      } catch (e) {
        setErr(e.message || "Failed");
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="rounded-lg p-3 bg-rose-500/10 text-rose-200 border border-rose-400/20 text-sm">
        {err}
      </div>
    );
  }
  if (!data) return <div className="text-slate-400 text-sm">Loading…</div>;

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs text-slate-400">Your code</div>
          <div className="mt-1 text-white font-mono">{data.code || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Referred users</div>
          <div className="mt-1 text-white font-mono">{data.referralCount ?? 0}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-400">Your link</div>
        <div className="mt-1 flex items-center gap-2">
          <code className="px-3 py-2 rounded-lg bg-black/30 text-slate-200 break-all">{data.link}</code>
          <button
            onClick={() => copy(data.link)}
            className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/15"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        Tip: Post your link on X/Telegram/Discord. Each new signup gives you +100 Paper and your friend +20 Paper!
      </div>
    </div>
  );
}
