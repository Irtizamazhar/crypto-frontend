// src/services/payments.js
import { appReq } from "./api";

export async function createPayment(body = {}) {
  return appReq(`/api/payments/create`, { method: "POST", body: JSON.stringify(body) });
}

export async function confirmPayment(orderId, body) {
  return appReq(`/api/payments/${encodeURIComponent(orderId)}/confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
