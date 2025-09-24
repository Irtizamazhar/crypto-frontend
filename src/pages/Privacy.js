import React from "react";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-xl font-semibold mt-4">Data we collect</h2>
      <ul className="list-disc pl-6">
        <li>Account: name, email</li>
        <li>Usage: alerts, watchlist, learning progress</li>
        <li>Technical: IP/device for security & anti-abuse</li>
      </ul>

      <h2 className="text-xl font-semibold mt-4">How we use it</h2>
      <ul className="list-disc pl-6">
        <li>Provide and improve the service</li>
        <li>Security, rate limiting, fraud prevention</li>
        <li>Transactional and product emails (opt-out where applicable)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-4">Your controls</h2>
      <ul className="list-disc pl-6">
        <li>Edit profile; change password</li>
        <li>Request data export or deletion</li>
      </ul>

      <h2 className="text-xl font-semibold mt-4">Retention & sharing</h2>
      <p>We retain data as needed for the service. We do not sell your data. We may use vetted processors (email, analytics) under contract.</p>
    </div>
  );
}
