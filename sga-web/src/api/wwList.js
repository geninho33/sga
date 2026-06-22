import { apiJson } from "./client";

export async function fetchWwList(apiPath, params = {}) {
  return apiJson(apiPath, { params });
}
