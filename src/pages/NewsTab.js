import React from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

export default function NewsTab({ coin, news }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="glass p-5 rounded-xl"
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Newspaper size={20} /> Latest News about {coin.name}
      </h2>

      {news.length === 0 ? (
        <div className="text-slate-400 text-center py-10">No recent news found for {coin.name}.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {news.slice(0, 6).map((item, index) => (
            <motion.div
              key={`${item.url}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass p-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 mb-2">{item.description}</p>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{item.source}</span>
                <span>{new Date(item.published_at).toLocaleDateString()}</span>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs mt-2 inline-block">
                Read more →
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
