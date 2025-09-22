// src/pages/PostPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, PlusCircle, Send, Tag, Link as LinkIcon, Smile,
  ThumbsUp, Rocket, Flame, MessageSquare, MoreHorizontal, Trash2,
  TrendingUp, TrendingDown, DollarSign, X
} from "lucide-react";

/* =========================================================================
   STORAGE & COMPAT (keeps your existing FEED_KEY and pushFeedAction shape)
   ========================================================================= */
const FEED_KEY = "public_feed_v1";

function readFeed() {
  try {
    const arr = JSON.parse(localStorage.getItem(FEED_KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.map((e) => {
      // migrate legacy trade
      if (!e.type && (e.side || e.amount)) {
        return {
          ...e,
          type: "trade",
          text: `${e.user || `Trader#${e.id % 1000}`} opened ${e.side === "UP" ? "LONG" : "SHORT"} on ${e.coin} for $${e.amount}`,
          sentiment: e.side === "UP" ? "bullish" : "bearish",
          reactions: e.reactions || { like: 0, rocket: 0, fire: 0, think: 0 },
          comments: e.comments || [],
        };
      }
      return {
        reactions: { like: 0, rocket: 0, fire: 0, think: 0, ...(e.reactions || {}) },
        comments: Array.isArray(e.comments) ? e.comments : [],
        ...e,
      };
    });
  } catch {
    return [];
  }
}
function writeFeed(arr) {
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(arr.slice(0, 250)));
  } catch {}
}
// Exported so other pages (e.g., trades) can push feed actions
export function pushFeedAction({ user, coin, side, amount }) {
  const entry = {
    id: Date.now(),
    type: "trade",
    user,
    coin,
    side,
    amount,
    ts: Date.now(),
    text: `${user || `Trader#${Math.floor(Math.random() * 900) + 100}`} opened ${side === "UP" ? "LONG" : "SHORT"} on ${coin} for $${amount}`,
    sentiment: side === "UP" ? "bullish" : "bearish",
    reactions: { like: 0, rocket: 0, fire: 0, think: 0 },
    comments: [],
  };
  const arr = [entry, ...readFeed()];
  writeFeed(arr);
}

/* =========================================================================
   UTILS
   ========================================================================= */
const SUGGESTED_COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","MATIC","LINK","DOT","LTC"];
const avatar = (seed) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(seed||"you"))}`;

const cls = (...xs) => xs.filter(Boolean).join(" ");
const fmtAmt = (n) => (Number(n)||0).toLocaleString(undefined,{maximumFractionDigits:2});
const urlHost = (u) => { try { return new URL(u).hostname.replace(/^www\./,""); } catch { return ""; } };
const ago = (ts) => {
  const s = Math.floor((Date.now() - ts)/1000);
  if (s<60) return `${s}s`; const m=Math.floor(s/60);
  if (m<60) return `${m}m`; const h=Math.floor(m/60);
  if (h<24) return `${h}h`; const d=Math.floor(h/24);
  return `${d}d`;
};

/* =========================================================================
   COMPOSER (modal-style)
   ========================================================================= */
function Composer({ open, onClose, onSubmit }) {
  const [text,setText]=useState("");
  const [coin,setCoin]=useState("");
  const [url,setUrl]=useState("");
  const [sentiment,setSentiment]=useState("");

  useEffect(()=>{ if(!open){ setText(""); setCoin(""); setUrl(""); setSentiment(""); }},[open]);
  const canPost = text.trim().length>0 || url.trim().length>0;

  const submit=()=>{
    if(!canPost) return;
    onSubmit({
      id: Date.now(),
      type: url ? "news" : "post",
      user: "You",
      avatar: avatar("you"),
      text: text.trim(),
      coin: coin.trim().toUpperCase() || undefined,
      url: url.trim() || undefined,
      title: undefined,
      sentiment: sentiment || undefined,
      reactions: { like:0, rocket:0, fire:0, think:0 },
      comments: [],
      ts: Date.now(),
    });
    onClose();
  };

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: 30, opacity: 0, scale: .98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: .98 }}
        className="relative w-full sm:max-w-2xl mx-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-lg shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold">Write Post</div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 text-slate-400"><X size={18}/></button>
        </div>

        <div className="flex gap-3">
          <img src={avatar("you")} alt="you" className="h-10 w-10 rounded-full border border-white/10"/>
          <textarea
            rows={4}
            value={text}
            onChange={(e)=>setText(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none resize-none"
            placeholder="Share a thought, setup, or quick note… #alpha"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-400"/>
            <input
              value={coin}
              onChange={(e)=>setCoin(e.target.value)}
              placeholder="Coin (e.g., BTC)"
              className="px-2 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 outline-none"
              list="coins-suggest" maxLength={6}
            />
            <datalist id="coins-suggest">
              {SUGGESTED_COINS.map(c=><option key={c} value={c} />)}
            </datalist>
          </div>
          <select
            value={sentiment}
            onChange={(e)=>setSentiment(e.target.value)}
            className="px-2 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-slate-200 outline-none"
          >
            <option value="">Sentiment</option>
            <option value="bullish">🐂 Bullish</option>
            <option value="bearish">🐻 Bearish</option>
            <option value="neutral">😶 Neutral</option>
          </select>
          <div className="flex items-center gap-2">
            <LinkIcon size={16} className="text-slate-400"/>
            <input
              value={url}
              onChange={(e)=>setUrl(e.target.value)}
              placeholder="Optional: link to news or analysis"
              className="px-2 py-1 rounded-md text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 outline-none w-64"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              disabled={!canPost}
              onClick={submit}
              className={cls(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition shadow-sm",
                canPost ? "bg-cyan-600/80 hover:bg-cyan-600 text-white" : "bg-white/5 text-slate-400 cursor-not-allowed"
              )}
            >
              <Send size={14}/> Post
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   ITEM PARTS
   ========================================================================= */
function ReactionBar({ entry, onReact }) {
  const btns = [
    { k:"like",   icon:<ThumbsUp size={16}/>,  label:"Like" },
    { k:"rocket", icon:<Rocket size={16}/>,    label:"Rocket" },
    { k:"fire",   icon:<Flame size={16}/>,     label:"Fire" },
    { k:"think",  icon:<Smile size={16}/>,     label:"Think" },
  ];
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {btns.map(b=>(
        <button key={b.k} onClick={()=>onReact(entry.id,b.k)}
          className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition flex items-center gap-1">
          {b.icon}{b.label}
          {!!entry.reactions?.[b.k] && <span className="text-[10px] text-slate-400">({entry.reactions[b.k]})</span>}
        </button>
      ))}
    </div>
  );
}

function CommentBox({ entry, onComment, onDelete }) {
  const [text,setText]=useState("");
  const add=()=>{
    if(!text.trim()) return;
    onComment(entry.id, { id:Date.now(), user:"You", avatar:avatar("you"), text:text.trim(), ts:Date.now() });
    setText("");
  };
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter" && add()}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 outline-none"
        />
        <button onClick={add} className="px-3 py-2 rounded-lg text-xs bg-cyan-600/80 hover:bg-cyan-600 text-white">Reply</button>
      </div>
      <div className="space-y-2">
        {entry.comments?.map(c=>(
          <div key={c.id} className="flex items-start gap-2 rounded-lg bg-white/5 border border-white/10 p-2">
            <img src={c.avatar||avatar(c.user)} alt="" className="h-6 w-6 rounded-full"/>
            <div className="flex-1">
              <div className="text-[11px]">
                <span className="font-semibold text-slate-200">{c.user}</span>{" "}
                <span className="text-slate-500">{ago(c.ts)} ago</span>
              </div>
              <div className="text-xs text-slate-300">{c.text}</div>
            </div>
            {c.user==="You" && (
              <button onClick={()=>onDelete(entry.id,c.id)} className="p-1 rounded-md hover:bg-white/10 text-slate-400" title="Delete">
                <Trash2 size={14}/>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, tone }) {
  const map = {
    coin:     "bg-indigo-500/15 text-indigo-300 border-indigo-400/20",
    bullish:  "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    bearish:  "bg-rose-500/15 text-rose-300 border-rose-400/20",
    neutral:  "bg-slate-500/15 text-slate-300 border-slate-400/20",
  }[tone] || "bg-white/10 text-slate-300 border-white/10";
  return <span className={`text-[10px] px-2 py-1 rounded-full border ${map}`}>{children}</span>;
}

function FeedCard({ entry, onReact, onComment, onDeleteComment, onDeletePost }) {
  const isTrade = entry.type==="trade";
  const isNews  = entry.type==="news";
  return (
    <motion.div layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <img src={entry.avatar || avatar(entry.user)} alt="" className="h-10 w-10 rounded-full border border-white/10"/>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-slate-200">{entry.user || "Anon"}</span>
              <span className="text-slate-500 text-xs"> • {ago(entry.ts)} ago</span>
            </div>
            <button className="p-1 rounded-md hover:bg-white/10 text-slate-400"><MoreHorizontal size={16}/></button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {entry.coin && <Pill tone="coin">{entry.coin}</Pill>}
            {entry.sentiment && <Pill tone={entry.sentiment}>{entry.sentiment}</Pill>}
            {isTrade && (
              <>
                {entry.side==="UP" ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 flex items-center gap-1">
                    <TrendingUp size={12}/> LONG
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-rose-500/10 border border-rose-400/20 text-rose-300 flex items-center gap-1">
                    <TrendingDown size={12}/> SHORT
                  </span>
                )}
                {Number(entry.amount) ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1">
                    <DollarSign size={12}/> ${fmtAmt(entry.amount)}
                  </span>
                ) : null}
              </>
            )}
          </div>

          {entry.text && <div className="text-sm text-slate-200 whitespace-pre-wrap">{entry.text}</div>}

          {entry.url && (
            <a href={entry.url} target="_blank" rel="noreferrer" className="block group">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <div className="p-3">
                  <div className="text-xs text-slate-400">{urlHost(entry.url)}</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {entry.title || "Shared link"}
                  </div>
                  {isNews && <div className="text-[11px] text-slate-400 mt-1">Community-shared crypto news</div>}
                </div>
              </div>
            </a>
          )}

          <ReactionBar entry={entry} onReact={onReact}/>
          <CommentBox entry={entry} onComment={onComment} onDelete={onDeleteComment}/>

          {entry.user==="You" && (
            <div className="pt-1">
              <button onClick={()=>onDeletePost(entry.id)} className="text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1">
                <Trash2 size={14}/> Delete post
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   PAGE: PostPage (default shows All posts; “Write Post” at top)
   ========================================================================= */
export default function PostPage() {
  const [feed,setFeed]   = useState(readFeed());
  const [tab,setTab]     = useState("all"); // all | posts | news | trades
  const [query,setQuery] = useState("");
  const [openComposer,setOpenComposer]=useState(false);

  // live sync from localStorage (other tabs/actions may write)
  useEffect(()=>{ const i=setInterval(()=>setFeed(readFeed()), 1200); return ()=>clearInterval(i); },[]);

  const add = (entry)=>{ const next=[entry, ...readFeed()]; writeFeed(next); setFeed(next); };
  const react = (id,key)=>{
    const next = readFeed().map(e=>{
      if(e.id!==id) return e;
      const reactions={...(e.reactions||{})}; reactions[key]=(reactions[key]||0)+1;
      return {...e, reactions};
    });
    writeFeed(next); setFeed(next);
  };
  const comment = (id, c)=>{
    const next = readFeed().map(e=>{
      if(e.id!==id) return e;
      return {...e, comments:[...(e.comments||[]), c]};
    });
    writeFeed(next); setFeed(next);
  };
  const deleteComment = (postId, commentId)=>{
    const next = readFeed().map(e=>{
      if(e.id!==postId) return e;
      return {...e, comments:(e.comments||[]).filter(c=>c.id!==commentId)};
    });
    writeFeed(next); setFeed(next);
  };
  const deletePost = (postId)=>{
    const next = readFeed().filter(e=>e.id!==postId);
    writeFeed(next); setFeed(next);
  };

  const filtered = useMemo(()=>{
    let arr=[...feed];
    if(tab!=="all"){
      arr = arr.filter(e => tab==="posts" ? e.type==="post" : tab==="news" ? e.type==="news" : e.type==="trade");
    }
    if(query.trim()){
      const q=query.trim().toLowerCase();
      arr = arr.filter(e =>
        (e.text||"").toLowerCase().includes(q) ||
        (e.coin||"").toLowerCase().includes(q) ||
        (e.user||"").toLowerCase().includes(q)
      );
    }
    return arr.sort((a,b)=>(b.ts||0)-(a.ts||0));
  },[feed,tab,query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users/> Community Posts</h1>
          <div className="text-xs text-slate-400">Discuss markets • Share news • Learn together</div>
        </div>
        <button
          onClick={()=>setOpenComposer(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-sm shadow"
        >
          <PlusCircle size={16}/> Write Post
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {["all","posts","news","trades"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={cls(
              "text-xs px-3 py-1.5 rounded-full border transition",
              tab===t ? "bg-cyan-600/80 text-white border-cyan-500/40"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            )}
          >
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
        <input
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          placeholder="Search posts, coins, users…"
          className="ml-auto px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Empty state */}
      {filtered.length===0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
          Nothing here yet. Click <strong>Write Post</strong> to share your first update!
        </div>
      )}

      {/* Feed list */}
      <AnimatePresence initial={false}>
        {filtered.map(entry=>(
          <FeedCard
            key={entry.id}
            entry={entry}
            onReact={react}
            onComment={comment}
            onDeleteComment={deleteComment}
            onDeletePost={deletePost}
          />
        ))}
      </AnimatePresence>

      {/* Composer modal */}
      <AnimatePresence>
        <Composer open={openComposer} onClose={()=>setOpenComposer(false)} onSubmit={add}/>
      </AnimatePresence>

      {/* Footer hint */}
      <div className="pt-2 text-[10px] text-slate-500">
        Community content is user-submitted. Do your own research. No financial advice.
      </div>
    </div>
  );
}
