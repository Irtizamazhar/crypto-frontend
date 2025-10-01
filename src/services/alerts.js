import { appReq } from "./api";

// token is added automatically by appReq (via getToken)

export async function alertsLimits() {
  return appReq(`/api/alerts/limits`);
}
export async function listAlerts() {
  return appReq(`/api/alerts`);
}
export async function createAlert(body) {
  return appReq(`/api/alerts`, { method: "POST", body: JSON.stringify(body) });
}
export async function updateAlertApi(id, patch) {
  return appReq(`/api/alerts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
export async function deleteAlert(id) {
  return appReq(`/api/alerts/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function clearAlerts() {
  return appReq(`/api/alerts/clear`, { method: "POST" });
}
