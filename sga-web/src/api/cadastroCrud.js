import { apiJson } from "./client";
import { buildRecordApiPath } from "../data/wwForms";

export async function fetchWwRecord(config, recordId) {
  const path = buildRecordApiPath(config, recordId, false);
  const res = await apiJson(path);
  return res.data;
}

export async function createWwRecord(config, payload) {
  const res = await apiJson(config.apiPath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateWwRecord(config, recordId, payload) {
  const path = buildRecordApiPath(config, recordId, false);
  const res = await apiJson(path, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}
