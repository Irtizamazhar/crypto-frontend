// src/services/wallet.js
import { APP_API, appReq, setToken, getToken } from "./api";

export const WalletAPI = {
  async getTrc20Wallet() {
    try {
      const data = await appReq("/wallet/trc20");
      return {
        address: data.address || "Address not available",
        trx: data.trx || 0,
        usdt: data.usdt || 0,
        error: data.error || null
      };
    } catch (error) {
      console.error("Error fetching TRC20 wallet:", error);
      return {
        address: "Address not available",
        trx: 0,
        usdt: 0,
        error: error.message
      };
    }
  },

  async getBalance() {
    try {
      return await appReq("/wallet/balance");
    } catch (error) {
      console.error("Error fetching balance:", error);
      return { paper: 0, fiatUsd: 0, error: error.message };
    }
  },

  async listDeposits() {
    try {
      return await appReq("/deposits");
    } catch (error) {
      console.error("Error fetching deposits:", error);
      return { deposits: [], error: error.message };
    }
  },

  async purchase({ amount_usdt, item_code }) {
    try {
      return await appReq("/wallet/purchase", { 
        method: "POST", 
        body: JSON.stringify({ amount_usdt, item_code }) 
      });
    } catch (error) {
      console.error("Error making purchase:", error);
      throw error;
    }
  },

  async createTrc20Wallet() {
    try {
      return await appReq("/wallet/trc20/create", { method: "POST" });
    } catch (error) {
      console.error("Error creating TRC20 wallet:", error);
      throw error;
    }
  },

  async getTransactionHistory({ page = 1, limit = 20 } = {}) {
    try {
      return await appReq(`/wallet/transactions?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return { transactions: [], error: error.message };
    }
  }
};

// Fiat balance and withdrawal functions
export async function fetchFiatBalance(token) {
  try {
    const response = await fetch(`${APP_API}/api/usdt/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching fiat balance:", error);
    return { balance: 0, error: error.message };
  }
}

export async function requestWithdraw(token, { amount, note }) {
  try {
    const response = await fetch(`${APP_API}/api/usdt/withdraw`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, note })
    });
    return await response.json();
  } catch (error) {
    console.error("Error requesting withdrawal:", error);
    throw error;
  }
}

export async function fetchFiatHistory(token, { page = 1, limit = 20 } = {}) {
  try {
    const response = await fetch(`${APP_API}/api/usdt/history?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching fiat history:", error);
    return { history: [], error: error.message };
  }
}