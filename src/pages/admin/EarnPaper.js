// src/pages/admin/EarnPaper.js
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/admin";

function Section({ title, actions, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5">{children}</div>
    </section>
  );
}

export default function EarnPaper() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    daily_reward_base: 1,
    daily_reward_cap: 3,
    streak_step: 3,
    tap_reward: 1,
    referral_bonus: 5,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const j = await AdminAPI.getPaperSettings();
        if (j) setForm((f) => ({ ...f, ...j }));
      } catch {
        setMsg("Using defaults (load failed).");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    setMsg("");
    try {
      await AdminAPI.savePaperSettings(form);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e.message || "Save failed.");
    }
  }

  return (
    <Section
      title="Earn Paper — Settings"
      actions={<button onClick={onSave} className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">Save</button>}
    >
      <div className="p-4 grid sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            {[
              ["Daily Reward (base)", "daily_reward_base"],
              ["Daily Reward Cap", "daily_reward_cap"],
              ["Streak Step (days)", "streak_step"],
              ["TapTap Reward", "tap_reward"],
              ["Referral Bonus", "referral_bonus"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs text-slate-400">{label}</label>
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 rounded bg-slate-900 border border-white/10"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </>
        )}
      </div>
      {msg && <div className="p-3 text-xs text-amber-200 border-t border-white/10">{msg}</div>}
    </Section>
  );
}
