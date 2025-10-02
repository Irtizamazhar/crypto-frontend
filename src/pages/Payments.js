import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { appReq } from "../services/api"; // your existing helper

export default function Payments() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const plan   = params.get("plan")   || "pro";
  const amount = Number(params.get("amount") || 10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payment, setPayment] = useState(null); // { id, toAddress, amount }
  const [copied, setCopied] = useState(false);

  const amountStr = useMemo(
    () => (Number.isFinite(amount) ? amount.toFixed(2) : "0.00"),
    [amount]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        // Create a payment intent on the server; your backend route may be /api/payments
        // If you mounted it differently, change the path here.
        const data = await appReq("/api/payments", {
          method: "POST",
          body: JSON.stringify({ plan, amount }),
        });

        if (!mounted) return;

        // Expecting { id, toAddress, amount } from server
        setPayment({
          id: data.id,
          toAddress: data.toAddress,
          amount: data.amount ?? amount,
        });
      } catch (e) {
        // If the route isn't ready yet, still render a helpful message
        setErr(
          e?.message ||
            "Could not create payment. Please try again or contact support."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [plan, amount]);

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Complete Payment
        </h1>
        <p className="text-slate-400 mt-2">
          Plan: <strong className="uppercase">{plan}</strong> • Amount:{" "}
          <strong>{amountStr}</strong> USDT (TRC20)
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-800/80 p-6">
          {loading ? (
            <div className="text-slate-300">Creating your payment…</div>
          ) : err ? (
            <div className="text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>{err}</span>
              </div>
              <button
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => nav("/plans")}
              >
                Back to Plans
              </button>
            </div>
          ) : payment ? (
            <>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Send exactly</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {Number(payment.amount).toFixed(2)} USDT
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">To this address</div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="px-3 py-2 rounded-lg bg-black/30 text-slate-200 break-all">
                      {payment.toAddress}
                    </code>
                    <button
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
                      onClick={() => copy(payment.toAddress)}
                      title="Copy"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Network: <strong>TRON (TRC20)</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  After the transfer is confirmed on-chain, your plan will be
                  upgraded automatically. Keep this page open for a few minutes;
                  we’ll detect the payment.
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => nav("/alerts")}
                >
                  Go to Alerts
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
                  onClick={() => nav("/plans")}
                >
                  Back to Plans
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
