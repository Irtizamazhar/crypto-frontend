import React from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../context/AlertsContext";
import { Shield, Bell, Zap } from "lucide-react";

export default function Plans() {
  const nav = useNavigate();
  const { limits } = useAlerts(); // { plan, used, max } from your context

  const goPro = () => {
    // Send the user to the Payments page with desired plan + amount
    // Adjust amount if you price Pro differently
    nav("/payments?plan=pro&amount=10");
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-slate-400 mt-2">
          You currently have <strong>{limits.used}</strong> of{" "}
          <strong>{limits.max}</strong> alerts on the{" "}
          <strong className="uppercase">{limits.plan}</strong> plan.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-slate-300" />
              <h2 className="text-xl font-bold text-white">Free</h2>
            </div>
            <p className="text-slate-400 mt-2">Great to get started.</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> 2 alerts included
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Real-time notifications
              </li>
            </ul>
            <div className="mt-6">
              <div className="text-3xl font-extrabold text-white">$0</div>
              <div className="text-slate-400 text-sm">forever</div>
            </div>
            <button
              className="mt-6 w-full px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
              onClick={() => window.history.back()}
            >
              Stay on Free
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-indigo-300" />
              <h2 className="text-xl font-bold text-white">Pro</h2>
            </div>
            <p className="text-slate-200 mt-2">For active traders.</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Unlimited alerts
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Priority alert processing
              </li>
            </ul>
            <div className="mt-6">
              <div className="text-3xl font-extrabold text-white">$10</div>
              <div className="text-slate-300 text-sm">one-time / demo</div>
            </div>
            <button
              className="mt-6 w-full px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
              onClick={goPro}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
