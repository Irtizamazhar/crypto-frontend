import React from "react";

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-xl font-semibold mt-4">1. Purpose</h2>
      <p>CryptoSense provides educational market analysis, tools, and simulated trading. We do not provide financial advice.</p>

      <h2 className="text-xl font-semibold mt-4">2. Accounts</h2>
      <p>You are responsible for your account and actions. We may suspend accounts for abuse or violations.</p>

      <h2 className="text-xl font-semibold mt-4">3. Content</h2>
      <p>Creator opinions are their own. We may moderate or remove content that violates policies.</p>

      <h2 className="text-xl font-semibold mt-4">4. Rewards (Paper)</h2>
      <p>Paper is a loyalty point. Rules and values may evolve. On-chain token terms will be published before launch.</p>

      <h2 className="text-xl font-semibold mt-4">5. Liability</h2>
      <p>Use at your own risk. Trading involves risk. Service is provided “as is”.</p>

      <h2 className="text-xl font-semibold mt-4">6. Changes</h2>
      <p>We may update these terms and will post the effective date above.</p>
    </div>
  );
}
