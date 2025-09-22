import React from "react";

export default function SkeletonCard(){
  return (
    <div className="glass p-4 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-3" />
      <div className="h-6 w-40 bg-white/10 rounded mb-5" />
      <div className="h-10 w-full bg-white/10 rounded" />
    </div>
  );
}
