import { apiJson } from "./client";

export async function fetchGruposProduto() {
  const res = await apiJson("/api/produtos/referencias/grupos");
  return res.data;
}

export async function fetchOrigensProduto() {
  const res = await apiJson("/api/produtos/referencias/origens");
  return res.data;
}

export async function fetchTiposRemessaProduto() {
  const res = await apiJson("/api/produtos/referencias/tipos-remessa");
  return res.data;
}

export async function fetchTacosProduto() {
  const res = await apiJson("/api/produtos/referencias/tacos");
  return res.data;
}

export async function fetchUnidadesProduto() {
  const res = await apiJson("/api/produtos/referencias/unidades");
  return res.data;
}

export async function fetchProdutoReferencias() {
  const [grupos, origens, tiposRemessa, tacos, unidades] = await Promise.all([
    fetchGruposProduto(),
    fetchOrigensProduto(),
    fetchTiposRemessaProduto(),
    fetchTacosProduto(),
    fetchUnidadesProduto(),
  ]);
  return { grupos, origens, tiposRemessa, tacos, unidades };
}
