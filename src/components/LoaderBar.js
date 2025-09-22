import React from "react";

// Animated top progress bar (no external libs)
export default function LoaderBar({ active }) {
  return (
    <div className="fixed inset-x-0 top-0 z-[70] pointer-events-none">
      <div
        className={`h-1 transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
      >
        <div className="w-full h-full overflow-hidden bg-transparent">
          <div
            className="h-full w-1/2 animate-[loader_1.2s_linear_infinite] bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400"
            style={{ filter: "drop-shadow(0 0 8px rgba(168,85,247,.6))" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes loader {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
