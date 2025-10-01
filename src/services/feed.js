// src/services/feed.js
import { appReq, publicReq } from "./api";

export const FeedAPI = {
  // Get posts (public - no auth required)
  list: async ({ tab = "all", q = "", limit = 20, before = null } = {}) => {
    try {
      const qs = new URLSearchParams({ tab, q, limit: limit.toString() });
      if (before) qs.set("before", before);
      
      console.log('📡 Fetching public feed...');
      const response = await publicReq(`/api/feed?${qs.toString()}`);
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.list error:', error);
      throw error;
    }
  },

  // Create new post (requires auth)
  create: async (payload) => {
    try {
      console.log('📝 Creating post with auth...');
      const response = await appReq("/api/feed", { 
        method: "POST", 
        body: JSON.stringify(payload) 
      });
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.create error:', error);
      throw error;
    }
  },

  // Get comments for a post (public)
  comments: async (postId) => {
    try {
      const response = await publicReq(`/api/feed/${postId}/comments`);
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.comments error:', error);
      throw error;
    }
  },

  // Add comment to post (requires auth)
  addComment: async (postId, text) => {
    try {
      const response = await appReq(`/api/feed/${postId}/comments`, { 
        method: "POST", 
        body: JSON.stringify({ text }) 
      });
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.addComment error:', error);
      throw error;
    }
  },

  // React to post (requires auth)
  react: async (postId, kind) => {
    try {
      const response = await appReq(`/api/feed/${postId}/react`, { 
        method: "POST", 
        body: JSON.stringify({ kind }) 
      });
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.react error:', error);
      throw error;
    }
  },

  // Delete comment (requires auth)
  deleteComment: async (postId, commentId) => {
    try {
      const response = await appReq(`/api/feed/${postId}/comments/${commentId}`, { 
        method: "DELETE" 
      });
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.deleteComment error:', error);
      throw error;
    }
  },

  // Delete post (requires auth)
  deletePost: async (postId) => {
    try {
      const response = await appReq(`/api/feed/${postId}`, { 
        method: "DELETE" 
      });
      return response;
    } catch (error) {
      console.error('❌ FeedAPI.deletePost error:', error);
      throw error;
    }
  }
};