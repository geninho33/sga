import { apiJson } from "./client";

export async function fetchDashboardStats() {
  return apiJson("/api/dashboard/stats");
}
