// src/components/LuckyWheelModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { PaperAPI } from "../services/paper";

const SEGMENTS = [
  { label: "+5",   value: 5 },
  { label: "+10",  value: 10 },
  { label: "+5",   value: 5 },
  { label: "+20",  value: 20 },
  { label: "+5",   value: 5 },
  { label: "+10",  value: 10 },
  { label: "+5",   value: 5 },
  { label: "+50",  value: 50 },
];

export default function LuckyWheelModal({ open, onClose, onWon }) {
  const [spun, setSpun] = useState(false);
  const [deg, setDeg] = useState(0);
  const [result, setResult] = useState(null);
  if (!open) return null;

  const spin = async () => {
    if (spun) return;
    setSpun(true);

    // fake animation target
    const spins = 5 * 360;
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const slice = 360 / SEGMENTS.length;
    const targetAngle = 360 - targetIndex * slice - slice / 2; // pointer top

    const finalDeg = spins + targetAngle;
    setDeg(finalDeg);

    // call backend after short delay (to match anim)
    setTimeout(async () => {
      try {
        const r = await PaperAPI.spin();
        setResult(r.reward);
        onWon?.(r.reward);
      } catch (e) {
        setResult("Error");
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold">🎉 Welcome Spin</h3>
        <p className="text-sm text-slate-400 mt-1">Spin once to win bonus Paper coins.</p>

        <div className="relative mx-auto mt-6 w-64 h-64">
          {/* pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent border-b-yellow-400" />
          {/* wheel */}
          <motion.div
            className="w-full h-full rounded-full border border-white/10 overflow-hidden"
            animate={{ rotate: deg }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ background: "conic-gradient(#0ea5e9 0 45deg, #9333ea 45deg 90deg, #0ea5e9 90deg 135deg, #f59e0b 135deg 180deg, #0ea5e9 180deg 225deg, #9333ea 225deg 270deg, #0ea5e9 270deg 315deg, #ef4444 315deg 360deg)" }}
          />

          {/* labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            {SEGMENTS.map((s, i) => {
              const angle = (360 / SEGMENTS.length) * i;
              return (
                <div key={i} className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white"
                     style={{ transform: `rotate(${angle}deg) translateY(-120px) rotate(${-angle}deg)` }}>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={spin} disabled={spun} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
            {spun ? "Spinning…" : "Spin now"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white">Close</button>
        </div>

        {result && (
          <div className="mt-3 text-emerald-300 font-semibold">
            {result === "Error" ? "Spin failed. Try refreshing." : `You won +${result} Paper!`}
          </div>
        )}
      </div>
    </div>
  );
}
