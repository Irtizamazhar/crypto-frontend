// src/components/NewListings.js
import React, { useEffect, useState } from "react";
import { fetchAllNewListings, iconFor } from "../services/api";

export default function NewListings() {
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 6; // cards per page

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const data = await fetchAllNewListings();
      const now = Date.now();

      // ✅ Sirf future listings (upcoming)
      const filtered = data.filter((item) => {
        const t = new Date(item.published_at).getTime();
        return t > now;
      });

      setListings(filtered);
      setPage(1); // reset page
    } catch (e) {
      console.error("Failed to load listings", e);
    }
  }

  // pagination slice
  const startIndex = (page - 1) * perPage;
  const pagedListings = listings.slice(startIndex, startIndex + perPage);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">🚀 Upcoming Coin Listings</h2>

      {pagedListings.length === 0 ? (
        <p className="text-gray-400">No upcoming listings found.</p>
      ) : (
        <>
          {/* Grid of cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedListings.map((coin, idx) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center space-x-4 hover:shadow-lg hover:border-purple-500 transition"
              >
                {/* Coin Icon */}
                <img
                  src={iconFor(coin.title.split("/")[0])}
                  alt={coin.title}
                  className="w-12 h-12 rounded-full"
                />

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{coin.title}</h3>

                  {/* Exchange Info */}
                  <p className="text-sm text-gray-400">
                    Exchange:{" "}
                    <a
                      href={coin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-purple-400 hover:underline"
                    >
                      {coin.exchange || "Unknown"}
                    </a>
                  </p>

                  {/* Launch Date + Time + Seconds */}
                  <p className="text-xs text-gray-500">
                    Launch:{" "}
                    {coin.published_at
                      ? new Date(coin.published_at).toLocaleString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "TBA"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Next page button */}
          {listings.length > startIndex + perPage && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPage(page + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 hover:bg-purple-600 transition"
              >
                <span className="text-white text-lg">➜</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
