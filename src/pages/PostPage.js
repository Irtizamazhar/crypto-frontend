import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle, Send, Tag, Link as LinkIcon, Smile,
  ThumbsUp, Rocket, Flame, MessageCircle, Share2, Bookmark,
  MoreHorizontal, Trash2, TrendingUp, TrendingDown,
  DollarSign, Clock, Eye, Sparkles, Verified, Zap,
  X
} from "lucide-react";
import { FeedAPI } from "../services/feed";
import { useAuth } from "../context/AuthContext";
import CreatePostModal from "../components/CreatePostModal";

/* ------------------------------ helpers ------------------------------ */
const avatar = (seed) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(seed||"user"))}`;
const cls = (...xs) => xs.filter(Boolean).join(" ");
const fmtAmt = (n) => (Number(n)||0).toLocaleString(undefined,{maximumFractionDigits:2});
const urlHost = (u) => { try { return new URL(u).hostname.replace(/^www\./,""); } catch { return ""; } };
const ago = (ts) => { const s = Math.floor((Date.now() - ts)/1000);
  if (s < 60) return `${s}s`; const m=Math.floor(s/60); if (m<60) return `${m}m`;
  const h=Math.floor(m/60); if (h<24) return `${h}h`; const d=Math.floor(h/24);
  if (d<7) return `${d}d`; const w=Math.floor(d/7); return `${w}w`; };

/* ------------------------------ Reactions ------------------------------ */
function ReactionBar({ post, onReact }) {
  const items = [
    { key: "like",   icon: <ThumbsUp className="w-4 h-4"/>, label: "Like" },
    { key: "rocket", icon: <Rocket className="w-4 h-4"/>,   label: "Rocket" },
    { key: "fire",   icon: <Flame className="w-4 h-4"/>,    label: "Fire" },
    { key: "think",  icon: <Smile className="w-4 h-4"/>,    label: "Think" },
  ];
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-700/50">
      <div className="flex items-center gap-0 sm:gap-1">
        {items.map(r=> (
          <button key={r.key} onClick={()=>onReact(post, r.key)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-gray-700/50 border border-transparent hover:border-gray-600 group relative"
          >
            <div className="text-gray-400 group-hover:scale-110 transition-transform text-sm sm:text-base">{r.icon}</div>
            <span className="text-xs sm:text-sm font-medium text-gray-400">{post.reactions?.[r.key] || 0}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
        <div className="flex items-center gap-1"><Eye className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">{post.views || 0}</span></div>
        <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">{post.comment_count || 0}</span></div>
      </div>
    </div>
  );
}

/* ------------------------------ Comments ------------------------------ */
function CommentThread({ postId, canDelete, onLocalCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{ if(open && comments.length===0){ setLoading(true); FeedAPI.comments(postId).then(setComments).catch(()=>{}).finally(()=>setLoading(false)); }},[open, postId, comments.length]);

  const add = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { id } = await FeedAPI.addComment(postId, text.trim());
      setComments(prev => [...prev, { id, user:"You", text:text.trim(), ts:Date.now(), user_id:1, canDelete:true }]);
      onLocalCountChange(1);
      setText("");
    } catch (e) { alert("Failed to add comment: " + e.message); } finally { setSubmitting(false); }
  };
  const del = async (cid) => {
    try { await FeedAPI.deleteComment(postId, cid); setComments(prev => prev.filter(c => c.id!==cid)); onLocalCountChange(-1); }
    catch (e) { alert("Failed to delete comment: " + e.message); }
  };

  return (
    <div className="border-t border-gray-700/50">
      <button onClick={()=>setOpen(v=>!v)} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-700/30">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-300">
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4"/><span>{open ? "Hide" : "Show"} Comments</span>
          <span className="ml-auto bg-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">{comments.length}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-800/20">
              <div className="flex gap-2 sm:gap-3">
                <img src={avatar("you")} alt="You" className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl"/>
                <div className="flex-1 flex gap-1 sm:gap-2">
                  <input
                    value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&add()}
                    placeholder="Add a comment…" disabled={submitting}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm sm:text-base"
                  />
                  <button onClick={add} disabled={!text.trim()||submitting}
                    className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg sm:rounded-xl font-medium"
                  >
                    {submitting ? <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-3 h-3 sm:w-4 sm:h-4"/>}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-3 sm:py-4"><div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {comments.map(c=> (
                    <motion.div key={c.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex gap-2 sm:gap-3 group">
                      <img src={avatar(c.user)} alt="" className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl mt-0.5 sm:mt-1"/>
                      <div className="flex-1 bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="font-semibold text-white text-xs sm:text-sm">{c.user}</span>
                            {c.user==="You" && <Verified className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400"/>}
                            <span className="text-xs text-gray-400">• {ago(c.ts)}</span>
                          </div>
                          {(c.canDelete || canDelete) && (
                            <button onClick={()=>del(c.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded-lg">
                              <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400"/>
                            </button>
                          )}
                        </div>
                        <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">{c.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ Card ------------------------------ */
function FeedCard({ post, onReact, onDeletePost, onLocalMutate }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const isTrade = post.type==="trade";
  const isNews  = post.type==="news";

  // close the three-dots menu on outside click / Esc
  useEffect(() => {
    if (!menu) return;
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenu(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title:`Post by ${post.user}`, text:post.text, url }); }
      catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
    setMenu(false);
  };

  return (
    <motion.div
      layout initial={{opacity:0,y:20,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-20,scale:.95}}
      whileHover={{y:-2}} transition={{duration:.2}}
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-xl sm:shadow-2xl overflow-hidden"
    >
      <div className="p-4 sm:p-6 pb-2 sm:pb-4">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <img src={avatar(post.user)} alt={post.user} className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-purple-500/50"/>
              {post.user==="You" && <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 sm:p-1"><Verified className="w-2 h-2 sm:w-3 sm:h-3 text-white"/></div>}
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">{post.user}</h3>
                {post.user==="You" && <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">You</span>}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3"/><span>{ago(post.ts)}</span>
                {post.type && <><span>•</span><span className="capitalize">{post.type}</span></>}
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={()=>setMenu(v=>!v)} className="p-1.5 sm:p-2 hover:bg-gray-700/50 rounded-lg sm:rounded-xl text-gray-400 hover:text-white" aria-haspopup="menu" aria-expanded={menu}>
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{opacity:0,scale:.96,y:-8}}
                  animate={{opacity:1,scale:1,y:0}}
                  exit={{opacity:0,scale:.96,y:-8}}
                  className="absolute right-0 top-full mt-1 sm:mt-2 w-40 sm:w-48 rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gray-800/90 shadow-xl sm:shadow-2xl backdrop-blur-sm z-50"
                  role="menu"
                >
                  <button onClick={share} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4"/> Share Post
                  </button>
                  <button onClick={()=>{console.log('bookmark',post.id); setMenu(false);}} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4"/> Save Post
                  </button>
                  {post.canDelete && (
                    <button onClick={()=>{ setMenu(false); onDeletePost(post.id); }} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-red-500/10 flex items-center gap-2 text-xs sm:text-sm text-red-300 border-t border-gray-700/60">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/> Delete Post
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {(post.coin || post.sentiment) && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {post.coin && (
              <span className="px-2 py-1 sm:px-3 sm:py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> #{post.coin}
              </span>
            )}
            {post.sentiment && (
              <span className={cls(
                "px-2 py-1 sm:px-3 sm:py-2 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1",
                post.sentiment==="bullish" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : post.sentiment==="bearish" ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : "bg-gray-500/20 text-gray-300 border-gray-500/30"
              )}>
                {post.sentiment==="bullish" ? "🐂" : post.sentiment==="bearish" ? "🐻" : "⚖️"}
                <span className="hidden xs:inline ml-1">{post.sentiment==="bullish" ? "Bullish" : post.sentiment==="bearish" ? "Bearish" : "Neutral"}</span>
              </span>
            )}
          </div>
        )}

        {post.text && <p className="text-gray-200 text-sm sm:text-lg leading-relaxed whitespace-pre-wrap mb-3 sm:mb-4">{post.text}</p>}

        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="block group mb-3 sm:mb-4">
            <div className="border border-gray-600 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-800/50 hover:bg-gray-700/50 transition">
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2"><LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>{urlHost(post.url)}</div>
                <div className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-400 transition-colors">{post.title || "Shared Link"}</div>
                {isNews && <div className="text-xs sm:text-sm text-gray-400 mt-1.5 sm:mt-2 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> Community-shared crypto news</div>}
              </div>
            </div>
          </a>
        )}

        {isTrade && (
          <div className="bg-gray-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-1.5 sm:mb-2 border border-gray-700/50">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Position</div>
                <div className={cls("flex items-center justify-center gap-1 text-xs sm:text-sm font-semibold",
                  post.side==="UP" ? "text-emerald-400" : "text-rose-400")}>
                  {post.side==="UP" ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4"/> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4"/>}
                  {post.side==="UP" ? "LONG" : "SHORT"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Amount</div>
                <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-semibold text-white">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4"/> ${fmtAmt(post.amount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ReactionBar post={post} onReact={onReact}/>
      <CommentThread
        postId={post.id}
        canDelete={post.canDelete}
        onLocalCountChange={(d)=>onLocalMutate(post.id, { comment_count:(post.comment_count||0)+d })}
      />
    </motion.div>
  );
}

/* ------------------------------ Mobile Create Post Button ------------------------------ */
function MobileCreateButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="sm:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-2xl grid place-items-center z-50"
      aria-label="Create Post"
    >
      <PlusCircle className="w-6 h-6" />
    </button>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function PostPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [tab] = useState("all");
  const [openComposer, setOpenComposer] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (append=false, before=cursor) => {
    if (loading) return;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const { items, nextCursor } = await FeedAPI.list({ tab, q:"", limit: 10, before });
      setFeed(prev => append ? [...prev, ...items] : items);
      setCursor(nextCursor);
    } catch (e) {
      console.error("Failed to load posts:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(()=>{ load(false, null); },[]);

  const addLocal = (post) => {
    setFeed(prev => [{
      user:"You",
      user_id:user?.id,
      ts:Date.now(),
      reactions:{ like:0, rocket:0, fire:0, think:0 },
      comment_count:0,
      views:0,
      canDelete:true,
      ...post
    }, ...prev]);
  };

  const react = async (post, key) => {
    try {
      await FeedAPI.react(post.id, key);
      setFeed(prev => prev.map(p => p.id===post.id
        ? { ...p, reactions:{ ...(p.reactions||{}), [key]:(p.reactions?.[key]||0)+1 } }
        : p
      ));
    } catch (e) {
      alert("Failed to react: " + e.message);
    }
  };

  const delPost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await FeedAPI.deletePost(id); setFeed(prev => prev.filter(p => p.id!==id)); }
    catch (e) { alert("Failed to delete post: " + e.message); }
  };

  const mutate = (id, patch) => setFeed(prev => prev.map(p => p.id===id ? { ...p, ...patch } : p));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-20 sm:pb-0">
      {/* main */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* quick CTA card (Create Post) */}
        <div className="bg-gray-800/40 rounded-xl sm:rounded-2xl border border-gray-700/50 p-3 sm:p-5 mb-4 sm:mb-6 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm sm:text-base">Share your alpha</div>
            <div className="text-xs text-gray-400 truncate">Discuss markets • Post setups • Share news</div>
          </div>
          <button
            onClick={()=>setOpenComposer(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5"/>
            <span className="hidden xs:inline">Create</span>
          </button>
        </div>

        {/* feed */}
        <div className="space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex justify-center py-8 sm:py-12">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}

          <AnimatePresence mode="wait">
            {feed.length===0 && !loading ? (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl sm:rounded-3xl grid place-items-center">
                  <Zap className="w-6 h-6 sm:w-10 sm:h-10 text-purple-400"/>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">No posts yet</h3>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Be the first to share your crypto insights</p>
                <button onClick={()=>setOpenComposer(true)} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg text-sm sm:text-base">
                  Create First Post
                </button>
              </motion.div>
            ) : (
              feed.map(post=> (
                <FeedCard key={post.id} post={post} onReact={react} onDeletePost={delPost} onLocalMutate={mutate}/>
              ))
            )}
          </AnimatePresence>

          {cursor && (
            <div className="flex justify-center pt-6 sm:pt-8">
              <button onClick={()=>load(true, cursor)} disabled={loadingMore}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg sm:rounded-xl font-medium flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                {loadingMore ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : (<><PlusCircle className="w-4 h-4 sm:w-5 sm:h-5"/> Load More</>)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating create button */}
      <MobileCreateButton onClick={() => setOpenComposer(true)} />

      {/* Desktop floating FAB */}
      <button
        onClick={()=>setOpenComposer(true)}
        className="hidden sm:block fixed h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-xl grid place-items-center z-50"
        aria-label="Create Post"
        style={{
          right: `calc(1rem + max(0px, (var(--bot-size,72px) - var(--fab-size,48px)) / 2))`,
          bottom: `calc(var(--bot-size,72px) + var(--bot-gap,14px) + env(safe-area-inset-bottom))`
        }}
      >
        <PlusCircle className="w-6 h-6"/>
      </button>

      {/* composer modal */}
      <AnimatePresence>
        {openComposer && (
          <CreatePostModal
            open={openComposer}
            onClose={()=>setOpenComposer(false)}
            onSubmit={addLocal}
            FeedAPI={FeedAPI}
          />
        )}
      </AnimatePresence>

      {/* footer */}
      <div className="border-t border-gray-700/50 mt-12 sm:mt-16">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400"/>
            <span className="font-bold text-sm sm:text-base">CryptoAlpha</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2 px-2">
            The professional crypto community • Share insights • Discuss markets • Learn together
          </p>
          <div className="text-xs text-gray-500 px-2">
            Community content is user-submitted. Always DYOR. Not financial advice.
          </div>
        </div>
      </div>
    </div>
  );
}