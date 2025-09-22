import React, { useEffect, useState } from "react";
import { useWatchlist } from "../context/WatchlistContext";
import { fetchMarket } from "../services/api";
import CoinCard from "../components/CoinCard";

export default function Watchlist(){
  const { ids, clear } = useWatchlist();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true);
        if (ids.length === 0) { setList([]); return; }
        const r = await fetchMarket({ ids: ids.join(","), per_page: ids.length });
        setList(r);
      } finally { setLoading(false); }
    })();
  }, [ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        {ids.length>0 && <button onClick={clear} className="btn-ghost">Clear</button>}
      </div>

      {ids.length===0 && (
        <div className="glass p-6 text-slate-300">No coins yet. Go to Market and tap the ★ to follow coins.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:6}).map((_,i)=> <div key={i} className="glass h-36 animate-pulse"/>) :
          list.map(c => <CoinCard key={c.id} c={c}/>)
        }
      </div>
    </div>
  );
}
