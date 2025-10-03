// src/services/feed.js
import { appReq, publicReq, getToken } from "./api";

export const FeedAPI = {
  // Get posts
  // If a token exists, we use appReq so the server can include `myReaction` in results.
  list: async ({ tab = "all", q = "", limit = 20, before = null } = {}) => {
    const qs = new URLSearchParams({ tab, q, limit: String(limit) });
    if (before) qs.set("before", before);

    const hasToken = typeof getToken === "function" && !!getToken();
    const req = hasToken ? appReq : publicReq;

    try {
      return await req(`/api/feed?${qs.toString()}`);
    } catch (error) {
      console.error("❌ FeedAPI.list error:", error);
      throw error;
    }
  },

  // Create new post (requires auth)
  create: async (payload) => {
    try {
      return await appReq("/api/feed", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("❌ FeedAPI.create error:", error);
      throw error;
    }
  },

  // Get comments (public) — backend returns one-level thread with `replies: []`
  comments: async (postId) => {
    try {
      return await publicReq(`/api/feed/${postId}/comments`);
    } catch (error) {
      console.error("❌ FeedAPI.comments error:", error);
      throw error;
    }
  },

  // Add comment or reply (requires auth)
  // Pass `parentId` (or null) to create a reply.
  addComment: async (postId, text, parentId = null) => {
    try {
      return await appReq(`/api/feed/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text, parentId }),
      });
    } catch (error) {
      console.error("❌ FeedAPI.addComment error:", error);
      throw error;
    }
  },

  // React to post (requires auth)
  // Server enforces single reaction per user per post and returns:
  // { ok, myReaction, counts: { like, rocket, fire, think } }
  react: async (postId, kind) => {
    try {
      return await appReq(`/api/feed/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ kind }),
      });
    } catch (error) {
      console.error("❌ FeedAPI.react error:", error);
      throw error;
    }
  },

  // Delete comment (requires auth)
  deleteComment: async (postId, commentId) => {
    try {
      return await appReq(`/api/feed/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("❌ FeedAPI.deleteComment error:", error);
      throw error;
    }
  },

  // Delete post (requires auth)
  deletePost: async (postId) => {
    try {
      return await appReq(`/api/feed/${postId}`, { method: "DELETE" });
    } catch (error) {
      console.error("❌ FeedAPI.deletePost error:", error);
      throw error;
    }
  },
};
