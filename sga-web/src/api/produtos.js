import { apiJson } from "./client";

export async function fetchProdutos({
  page = 1,
  limit = 20,
  status,
  q,
  prodCodigo,
  prodTipo,
  prodOrigem,
  prodClassificacao,
  orderBy,
  orderDir,
} = {}) {
  return apiJson("/api/produtos", {
    params: {
      page,
      limit,
      status,
      q,
      prodCodigo,
      prodTipo,
      prodOrigem,
      prodClassificacao,
      orderBy,
      orderDir,
    },
  });
}

export async function fetchProduto(prodCodigo) {
  return apiJson(`/api/produtos/${prodCodigo}`);
}

export async function updateProduto(prodCodigo, data) {
  return apiJson(`/api/produtos/${prodCodigo}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function createProduto(data) {
  return apiJson("/api/produtos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function inativarProduto(prodCodigo) {
  return apiJson(`/api/produtos/${prodCodigo}/inativar`, { method: "PATCH" });
}

export async function inativarProdutos(prodCodigos) {
  return apiJson("/api/produtos/inativar", {
    method: "PATCH",
    body: JSON.stringify({ prodCodigos }),
  });
}

export async function reativarProduto(prodCodigo) {
  return apiJson(`/api/produtos/${prodCodigo}/reativar`, { method: "PATCH" });
}

export async function reativarProdutos(prodCodigos) {
  return apiJson("/api/produtos/reativar", {
    method: "PATCH",
    body: JSON.stringify({ prodCodigos }),
  });
}

export async function aplicarTabelaTacoProduto(prodTaco) {
  return apiJson("/api/produtos/aplicar-taco", {
    method: "POST",
    body: JSON.stringify({ prodTaco }),
  });
}
