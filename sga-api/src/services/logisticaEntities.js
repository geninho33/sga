import { pool } from "../db.js";
import { nextCode } from "./cadastroEntities.js";
import { paginatedList } from "./listQuery.js";

function auditUser(req) {
  return req.user?.usuUsuario || req.user?.usuNome || "web";
}

// --- Fornecedores ---
export async function loadFornecedor(prefCodigo, forCodigo) {
  const [rows] = await pool.query(
    `SELECT forCodigo, forNome, forAbreviatura, forCnpjcpf, forEndereco, forComplemento,
            forBairro, forCidade, forEstado, forCep, forTelefone, forContato, forEmail, forStatus
     FROM trnsfornecedores WHERE prefCodigo = :prefCodigo AND forCodigo = :forCodigo`,
    { prefCodigo, forCodigo }
  );
  return rows[0] ?? null;
}

export async function createFornecedor(prefCodigo, body) {
  const nome = String(body.forNome || "").trim();
  if (!nome) return { error: "Nome é obrigatório" };

  const forCodigo = await nextCode(prefCodigo, "trnsfornecedores", "forCodigo");
  const forStatus = body.forStatus === "I" ? "I" : "A";

  await pool.query(
    `INSERT INTO trnsfornecedores (
       prefCodigo, forCodigo, forNome, forAbreviatura, forCnpjcpf, forEndereco, forComplemento,
       forBairro, forCidade, forEstado, forCep, forTelefone, forContato, forEmail,
       forTipo, forCooperativa, forDap, forStatus, forDataCad, forDataAlt
     ) VALUES (
       :prefCodigo, :forCodigo, :forNome, :forAbreviatura, :forCnpjcpf, :forEndereco, :forComplemento,
       :forBairro, :forCidade, :forEstado, :forCep, :forTelefone, :forContato, :forEmail,
       0, 'N', 'N', :forStatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      forCodigo,
      forNome: nome,
      forAbreviatura: body.forAbreviatura != null ? String(body.forAbreviatura) : "",
      forCnpjcpf: body.forCnpjcpf != null ? String(body.forCnpjcpf) : "",
      forEndereco: body.forEndereco != null ? String(body.forEndereco) : "",
      forComplemento: body.forComplemento != null ? String(body.forComplemento) : "",
      forBairro: body.forBairro != null ? String(body.forBairro) : "",
      forCidade: body.forCidade != null ? String(body.forCidade) : "",
      forEstado: body.forEstado != null ? String(body.forEstado) : "",
      forCep: body.forCep != null ? String(body.forCep) : "",
      forTelefone: body.forTelefone != null ? String(body.forTelefone) : "",
      forContato: body.forContato != null ? String(body.forContato) : "",
      forEmail: body.forEmail != null ? String(body.forEmail) : "",
      forStatus,
    }
  );
  return { data: await loadFornecedor(prefCodigo, forCodigo) };
}

export async function updateFornecedor(prefCodigo, forCodigo, body) {
  const nome = String(body.forNome || "").trim();
  if (!nome) return { error: "Nome é obrigatório" };
  const forStatus = body.forStatus === "I" ? "I" : "A";

  const [result] = await pool.query(
    `UPDATE trnsfornecedores SET
       forNome = :forNome, forAbreviatura = :forAbreviatura, forCnpjcpf = :forCnpjcpf,
       forEndereco = :forEndereco, forComplemento = :forComplemento, forBairro = :forBairro,
       forCidade = :forCidade, forEstado = :forEstado, forCep = :forCep,
       forTelefone = :forTelefone, forContato = :forContato, forEmail = :forEmail,
       forStatus = :forStatus, forDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND forCodigo = :forCodigo`,
    {
      prefCodigo,
      forCodigo,
      forNome: nome,
      forAbreviatura: body.forAbreviatura != null ? String(body.forAbreviatura) : "",
      forCnpjcpf: body.forCnpjcpf != null ? String(body.forCnpjcpf) : "",
      forEndereco: body.forEndereco != null ? String(body.forEndereco) : "",
      forComplemento: body.forComplemento != null ? String(body.forComplemento) : "",
      forBairro: body.forBairro != null ? String(body.forBairro) : "",
      forCidade: body.forCidade != null ? String(body.forCidade) : "",
      forEstado: body.forEstado != null ? String(body.forEstado) : "",
      forCep: body.forCep != null ? String(body.forCep) : "",
      forTelefone: body.forTelefone != null ? String(body.forTelefone) : "",
      forContato: body.forContato != null ? String(body.forContato) : "",
      forEmail: body.forEmail != null ? String(body.forEmail) : "",
      forStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadFornecedor(prefCodigo, forCodigo) };
}

// --- Tipos de distribuição ---
export async function loadTipoDistribuicao(prefCodigo, disTipNumero) {
  const [rows] = await pool.query(
    `SELECT disTipNumero, disTipCodigo, disTipDescricao, disTipDescricaoPlural,
            disTipDias, disTipSemanas, disTipRemessaMes, disTipStatus
     FROM trnsdistribuicaotipo WHERE prefCodigo = :prefCodigo AND disTipNumero = :disTipNumero`,
    { prefCodigo, disTipNumero }
  );
  return rows[0] ?? null;
}

export async function createTipoDistribuicao(prefCodigo, body) {
  const desc = String(body.disTipDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const disTipNumero = await nextCode(prefCodigo, "trnsdistribuicaotipo", "disTipNumero");
  const disTipStatus = body.disTipStatus === "I" ? "I" : "A";

  await pool.query(
    `INSERT INTO trnsdistribuicaotipo (
       prefCodigo, disTipNumero, disTipCodigo, disTipDescricao, disTipDescricaoPlural,
       disTipDias, disTipSemanas, disTipRemessaMes, disTipStatus, disTipDataCad, disTipDataAlt
     ) VALUES (
       :prefCodigo, :disTipNumero, :disTipCodigo, :disTipDescricao, :disTipDescricaoPlural,
       :disTipDias, :disTipSemanas, :disTipRemessaMes, :disTipStatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      disTipNumero,
      disTipCodigo: body.disTipCodigo != null ? String(body.disTipCodigo) : String(disTipNumero),
      disTipDescricao: desc,
      disTipDescricaoPlural: body.disTipDescricaoPlural != null ? String(body.disTipDescricaoPlural) : desc,
      disTipDias: Number(body.disTipDias) || 0,
      disTipSemanas: Number(body.disTipSemanas) || 0,
      disTipRemessaMes: Number(body.disTipRemessaMes) || 0,
      disTipStatus,
    }
  );
  return { data: await loadTipoDistribuicao(prefCodigo, disTipNumero) };
}

export async function updateTipoDistribuicao(prefCodigo, disTipNumero, body) {
  const desc = String(body.disTipDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const disTipStatus = body.disTipStatus === "I" ? "I" : "A";

  const [result] = await pool.query(
    `UPDATE trnsdistribuicaotipo SET
       disTipCodigo = :disTipCodigo, disTipDescricao = :disTipDescricao,
       disTipDescricaoPlural = :disTipDescricaoPlural, disTipDias = :disTipDias,
       disTipSemanas = :disTipSemanas, disTipRemessaMes = :disTipRemessaMes,
       disTipStatus = :disTipStatus, disTipDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND disTipNumero = :disTipNumero`,
    {
      prefCodigo,
      disTipNumero,
      disTipCodigo: body.disTipCodigo != null ? String(body.disTipCodigo) : String(disTipNumero),
      disTipDescricao: desc,
      disTipDescricaoPlural: body.disTipDescricaoPlural != null ? String(body.disTipDescricaoPlural) : desc,
      disTipDias: Number(body.disTipDias) || 0,
      disTipSemanas: Number(body.disTipSemanas) || 0,
      disTipRemessaMes: Number(body.disTipRemessaMes) || 0,
      disTipStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadTipoDistribuicao(prefCodigo, disTipNumero) };
}

// --- Rotas ---
export async function loadRota(prefCodigo, rotaCodigo) {
  const [rows] = await pool.query(
    `SELECT rotaCodigo, rotaDescricao, rotaSetor, rotaStatus
     FROM trnsrota WHERE prefCodigo = :prefCodigo AND rotaCodigo = :rotaCodigo`,
    { prefCodigo, rotaCodigo }
  );
  return rows[0] ?? null;
}

export async function createRota(prefCodigo, body) {
  const desc = String(body.rotaDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const rotaCodigo = await nextCode(prefCodigo, "trnsrota", "rotaCodigo");
  const rotaStatus = body.rotaStatus === "I" ? "I" : "A";

  await pool.query(
    `INSERT INTO trnsrota (prefCodigo, rotaCodigo, rotaDescricao, rotaSetor, rotaStatus, rotaDataCad, rotaDataAlt)
     VALUES (:prefCodigo, :rotaCodigo, :rotaDescricao, :rotaSetor, :rotaStatus, NOW(), NOW())`,
    {
      prefCodigo,
      rotaCodigo,
      rotaDescricao: desc,
      rotaSetor: Number(body.rotaSetor) || 0,
      rotaStatus,
    }
  );
  return { data: await loadRota(prefCodigo, rotaCodigo) };
}

export async function updateRota(prefCodigo, rotaCodigo, body) {
  const desc = String(body.rotaDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const rotaStatus = body.rotaStatus === "I" ? "I" : "A";

  const [result] = await pool.query(
    `UPDATE trnsrota SET
       rotaDescricao = :rotaDescricao, rotaSetor = :rotaSetor, rotaStatus = :rotaStatus, rotaDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND rotaCodigo = :rotaCodigo`,
    {
      prefCodigo,
      rotaCodigo,
      rotaDescricao: desc,
      rotaSetor: Number(body.rotaSetor) || 0,
      rotaStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadRota(prefCodigo, rotaCodigo) };
}

// --- Notas de compra ---
export async function loadNota(prefCodigo, notaCodigo) {
  const [rows] = await pool.query(
    `SELECT n.notaCodigo, n.notaNumero, n.notaSerie, n.notaData, n.notaFornecedor,
            n.notaLocal, n.notaStatus, n.notaProgCodigo, f.forNome AS notaFornecedorNome
     FROM trnsnota n
     LEFT JOIN trnsfornecedores f ON f.prefCodigo = n.prefCodigo AND f.forCodigo = n.notaFornecedor
     WHERE n.prefCodigo = :prefCodigo AND n.notaCodigo = :notaCodigo`,
    { prefCodigo, notaCodigo }
  );
  return rows[0] ?? null;
}

export async function createNota(prefCodigo, body, req) {
  const notaNumero = String(body.notaNumero || "").trim();
  const notaSerie = String(body.notaSerie || "").trim();
  const notaFornecedor = Number(body.notaFornecedor);
  const notaLocal = Number(body.notaLocal);
  const notaData = body.notaData;

  if (!notaNumero) return { error: "Número da nota é obrigatório" };
  if (!notaSerie) return { error: "Série da nota é obrigatória" };
  if (!notaFornecedor) return { error: "Fornecedor é obrigatório" };
  if (!notaLocal) return { error: "Local de destino é obrigatório" };
  if (!notaData) return { error: "Data é obrigatória" };

  const notaCodigo = await nextCode(prefCodigo, "trnsnota", "notaCodigo");
  const notaStatus = body.notaStatus === "I" ? "I" : "A";
  const user = auditUser(req);

  await pool.query(
    `INSERT INTO trnsnota (
       prefCodigo, notaCodigo, notaNumero, notaSerie, notaData, notaFornecedor, notaLocal,
       notaProgCodigo, notaStatus, notaUserName, notaDataCadastro, notaDataAlteracao
     ) VALUES (
       :prefCodigo, :notaCodigo, :notaNumero, :notaSerie, :notaData, :notaFornecedor, :notaLocal,
       :notaProgCodigo, :notaStatus, :user, NOW(), NOW()
     )`,
    {
      prefCodigo,
      notaCodigo,
      notaNumero,
      notaSerie,
      notaData,
      notaFornecedor,
      notaLocal,
      notaProgCodigo: Number(body.notaProgCodigo) || 0,
      notaStatus,
      user,
    }
  );
  return { data: await loadNota(prefCodigo, notaCodigo) };
}

export async function updateNota(prefCodigo, notaCodigo, body, req) {
  const notaNumero = String(body.notaNumero || "").trim();
  const notaSerie = String(body.notaSerie || "").trim();
  const notaFornecedor = Number(body.notaFornecedor);
  const notaLocal = Number(body.notaLocal);
  const notaData = body.notaData;

  if (!notaNumero) return { error: "Número da nota é obrigatório" };
  if (!notaSerie) return { error: "Série da nota é obrigatória" };
  if (!notaFornecedor) return { error: "Fornecedor é obrigatório" };
  if (!notaLocal) return { error: "Local de destino é obrigatório" };
  if (!notaData) return { error: "Data é obrigatória" };

  const notaStatus = body.notaStatus === "I" ? "I" : "A";
  const user = auditUser(req);

  const [result] = await pool.query(
    `UPDATE trnsnota SET
       notaNumero = :notaNumero, notaSerie = :notaSerie, notaData = :notaData,
       notaFornecedor = :notaFornecedor, notaLocal = :notaLocal, notaProgCodigo = :notaProgCodigo,
       notaStatus = :notaStatus, notaUserName = :user, notaDataAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND notaCodigo = :notaCodigo`,
    {
      prefCodigo,
      notaCodigo,
      notaNumero,
      notaSerie,
      notaData,
      notaFornecedor,
      notaLocal,
      notaProgCodigo: Number(body.notaProgCodigo) || 0,
      notaStatus,
      user,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadNota(prefCodigo, notaCodigo) };
}

export async function listNotaItens(prefCodigo, notaCodigo, opts = {}) {
  const paginate = opts.page != null || opts.limit != null || opts.q;
  if (!paginate) {
    const [rows] = await pool.query(
      `SELECT ni.notaItemProduto, p.prodDescricao AS notaItemProdutoDescricao,
              ni.notaItemProdutoUnidade, u.uniDescricao AS notaItemProdutoUnidadeDesc,
              ni.notaItemQtde, ni.notaItemValor,
              (ni.notaItemQtde * ni.notaItemValor) AS notaItemTotal,
              ni.notaItemValidade, ni.notaItemLote
       FROM trnsnotaitens ni
       LEFT JOIN trnsprodutos p ON p.prefCodigo = ni.prefCodigo AND p.prodCodigo = ni.notaItemProduto
       LEFT JOIN trnsunidades u ON u.prefCodigo = ni.prefCodigo AND u.uniCodigo = ni.notaItemProdutoUnidade
       WHERE ni.prefCodigo = :prefCodigo AND ni.notaCodigo = :notaCodigo
       ORDER BY p.prodDescricao`,
      { prefCodigo, notaCodigo }
    );
    return rows;
  }

  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(opts.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(opts.q || "").trim();
  const params = { prefCodigo, notaCodigo, limit, offset };
  let filterSql = "";
  if (q) {
    filterSql = " AND (p.prodDescricao LIKE :q OR CAST(ni.notaItemProduto AS CHAR) LIKE :qLike)";
    params.q = `%${q}%`;
    params.qLike = `%${q}%`;
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM trnsnotaitens ni
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ni.prefCodigo AND p.prodCodigo = ni.notaItemProduto
     WHERE ni.prefCodigo = :prefCodigo AND ni.notaCodigo = :notaCodigo${filterSql}`,
    params
  );
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await pool.query(
    `SELECT ni.notaItemProduto, p.prodDescricao AS notaItemProdutoDescricao,
            ni.notaItemProdutoUnidade, u.uniDescricao AS notaItemProdutoUnidadeDesc,
            ni.notaItemQtde, ni.notaItemValor,
            (ni.notaItemQtde * ni.notaItemValor) AS notaItemTotal,
            ni.notaItemValidade, ni.notaItemLote
     FROM trnsnotaitens ni
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ni.prefCodigo AND p.prodCodigo = ni.notaItemProduto
     LEFT JOIN trnsunidades u ON u.prefCodigo = ni.prefCodigo AND u.uniCodigo = ni.notaItemProdutoUnidade
     WHERE ni.prefCodigo = :prefCodigo AND ni.notaCodigo = :notaCodigo${filterSql}
     ORDER BY p.prodDescricao
     LIMIT :limit OFFSET :offset`,
    params
  );

  return {
    data: rows,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function upsertNotaItem(prefCodigo, notaCodigo, body) {
  const nota = await loadNota(prefCodigo, notaCodigo);
  if (!nota) return { error: "Nota não encontrada", status: 404 };
  if (nota.notaStatus === "C") return { error: "Nota cancelada", status: 400 };

  const notaItemProduto = Number(body.notaItemProduto);
  const notaItemQtde = Number(body.notaItemQtde);
  const notaItemValor = Number(body.notaItemValor);
  if (!notaItemProduto) return { error: "Produto é obrigatório", status: 400 };
  if (Number.isNaN(notaItemQtde) || notaItemQtde < 0) return { error: "Quantidade inválida", status: 400 };
  if (Number.isNaN(notaItemValor) || notaItemValor < 0) return { error: "Valor inválido", status: 400 };

  let notaItemProdutoUnidade = Number(body.notaItemProdutoUnidade) || 0;
  if (!notaItemProdutoUnidade) {
    const [prows] = await pool.query(
      `SELECT prodUnidMedCompra FROM trnsprodutos WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      { prefCodigo, prodCodigo: notaItemProduto }
    );
    notaItemProdutoUnidade = Number(prows[0]?.prodUnidMedCompra) || 0;
  }

  const [existing] = await pool.query(
    `SELECT notaItemQtde FROM trnsnotaitens
     WHERE prefCodigo = :prefCodigo AND notaCodigo = :notaCodigo AND notaItemProduto = :notaItemProduto`,
    { prefCodigo, notaCodigo, notaItemProduto }
  );
  const notaItemValidade = body.notaItemValidade || null;
  const notaItemLote = body.notaItemLote != null ? String(body.notaItemLote) : null;
  const params = {
    prefCodigo,
    notaCodigo,
    notaItemProduto,
    notaItemQtde,
    notaItemValor,
    notaItemProdutoUnidade,
    notaItemValidade,
    notaItemLote,
  };

  if (existing.length) {
    await pool.query(
      `UPDATE trnsnotaitens SET
         notaItemQtde = :notaItemQtde,
         notaItemValor = :notaItemValor,
         notaItemProdutoUnidade = :notaItemProdutoUnidade,
         notaItemValidade = :notaItemValidade,
         notaItemLote = :notaItemLote
       WHERE prefCodigo = :prefCodigo AND notaCodigo = :notaCodigo AND notaItemProduto = :notaItemProduto`,
      params
    );
  } else {
    await pool.query(
      `INSERT INTO trnsnotaitens (
         prefCodigo, notaCodigo, notaItemProduto, notaItemQtde, notaItemValor,
         notaItemProdutoUnidade, notaItemValidade, notaItemLote, notaItemQtdeAntes
       ) VALUES (
         :prefCodigo, :notaCodigo, :notaItemProduto, :notaItemQtde, :notaItemValor,
         :notaItemProdutoUnidade, :notaItemValidade, :notaItemLote, 0
       )`,
      params
    );
  }

  const [rows] = await pool.query(
    `SELECT ni.notaItemProduto, p.prodDescricao AS notaItemProdutoDescricao,
            ni.notaItemProdutoUnidade, u.uniDescricao AS notaItemProdutoUnidadeDesc,
            ni.notaItemQtde, ni.notaItemValor,
            (ni.notaItemQtde * ni.notaItemValor) AS notaItemTotal,
            ni.notaItemValidade, ni.notaItemLote
     FROM trnsnotaitens ni
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ni.prefCodigo AND p.prodCodigo = ni.notaItemProduto
     LEFT JOIN trnsunidades u ON u.prefCodigo = ni.prefCodigo AND u.uniCodigo = ni.notaItemProdutoUnidade
     WHERE ni.prefCodigo = :prefCodigo AND ni.notaCodigo = :notaCodigo AND ni.notaItemProduto = :notaItemProduto`,
    { prefCodigo, notaCodigo, notaItemProduto }
  );
  return { data: rows[0] };
}

export async function deleteNotaItem(prefCodigo, notaCodigo, notaItemProduto) {
  const nota = await loadNota(prefCodigo, notaCodigo);
  if (!nota) return { error: "Nota não encontrada", status: 404 };
  if (nota.notaStatus === "C") return { error: "Nota cancelada", status: 400 };

  const [result] = await pool.query(
    `DELETE FROM trnsnotaitens
     WHERE prefCodigo = :prefCodigo AND notaCodigo = :notaCodigo AND notaItemProduto = :notaItemProduto`,
    { prefCodigo, notaCodigo, notaItemProduto: Number(notaItemProduto) }
  );
  if (result.affectedRows === 0) return { error: "Item não encontrado", status: 404 };
  return { message: "Item excluído." };
}

export async function cancelNota(prefCodigo, notaCodigo, body, req) {
  const user = auditUser(req);
  const motivo = String(body?.motivo || body?.notaDsCancelamento || "Cancelamento via web").trim();
  const [result] = await pool.query(
    `UPDATE trnsnota SET notaStatus = 'C', notaDsCancelamento = :motivo,
       notaUserName = :user, notaDataAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND notaCodigo = :notaCodigo AND notaStatus <> 'C'`,
    { prefCodigo, notaCodigo, motivo, user }
  );
  if (result.affectedRows === 0) return { error: "Nota não encontrada ou já cancelada", status: 400 };
  return { data: await loadNota(prefCodigo, notaCodigo), message: "Nota cancelada." };
}

export async function listDistribuicaoItens(prefCodigo, distCodigo, opts = {}) {
  const paginate = opts.page != null || opts.limit != null || opts.q;
  const baseSelect = `SELECT di.distItemProduto, p.prodDescricao AS distItemProdutoDescricao,
            COALESCE(u.uniDescricao, p.prodUnidMedConsumo) AS distItemProdutoUN,
            di.distItemQuantidade, di.distItemStatus, di.distItemValidade, di.distItemLote
     FROM trnsdistribuicaoitens di
     LEFT JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo`;

  if (!paginate) {
    const [rows] = await pool.query(
      `${baseSelect}
       WHERE di.prefCodigo = :prefCodigo AND di.distCodigo = :distCodigo
       ORDER BY p.prodDescricao`,
      { prefCodigo, distCodigo }
    );
    return rows;
  }

  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(opts.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(opts.q || "").trim();
  const params = { prefCodigo, distCodigo, limit, offset };
  let filterSql = "";
  if (q) {
    filterSql = " AND (p.prodDescricao LIKE :q OR CAST(di.distItemProduto AS CHAR) LIKE :qLike)";
    params.q = `%${q}%`;
    params.qLike = `%${q}%`;
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM trnsdistribuicaoitens di
     LEFT JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto
     WHERE di.prefCodigo = :prefCodigo AND di.distCodigo = :distCodigo${filterSql}`,
    params
  );
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await pool.query(
    `${baseSelect}
     WHERE di.prefCodigo = :prefCodigo AND di.distCodigo = :distCodigo${filterSql}
     ORDER BY p.prodDescricao
     LIMIT :limit OFFSET :offset`,
    params
  );

  return {
    data: rows,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function upsertDistribuicaoItem(prefCodigo, distCodigo, body) {
  const guia = await loadDistribuicao(prefCodigo, distCodigo);
  if (!guia) return { error: "Guia não encontrada", status: 404 };
  if (guia.distStatus === "C") return { error: "Guia cancelada", status: 400 };

  const distItemProduto = Number(body.distItemProduto);
  const distItemQuantidade = Number(body.distItemQuantidade);
  if (!distItemProduto) return { error: "Produto é obrigatório", status: 400 };
  if (Number.isNaN(distItemQuantidade) || distItemQuantidade < 0) {
    return { error: "Quantidade inválida", status: 400 };
  }

  const distItemStatus = body.distItemStatus === "I" ? "I" : "A";
  const distItemValidade = body.distItemValidade || null;
  const distItemLote = body.distItemLote != null ? String(body.distItemLote) : null;

  const [existing] = await pool.query(
    `SELECT distItemQuantidade FROM trnsdistribuicaoitens
     WHERE prefCodigo = :prefCodigo AND distCodigo = :distCodigo AND distItemProduto = :distItemProduto`,
    { prefCodigo, distCodigo, distItemProduto }
  );
  const params = {
    distCodigo,
    prefCodigo,
    distItemProduto,
    distItemQuantidade,
    distItemStatus,
    distItemValidade,
    distItemLote,
  };

  if (existing.length) {
    await pool.query(
      `UPDATE trnsdistribuicaoitens SET
         distItemQuantidade = :distItemQuantidade,
         distItemStatus = :distItemStatus,
         distItemValidade = :distItemValidade,
         distItemLote = :distItemLote
       WHERE prefCodigo = :prefCodigo AND distCodigo = :distCodigo AND distItemProduto = :distItemProduto`,
      params
    );
  } else {
    await pool.query(
      `INSERT INTO trnsdistribuicaoitens (
         distCodigo, prefCodigo, distItemProduto, distItemQuantidade, distItemStatus,
         distItemValidade, distItemLote, distItemQtdeAntes
       ) VALUES (
         :distCodigo, :prefCodigo, :distItemProduto, :distItemQuantidade, :distItemStatus,
         :distItemValidade, :distItemLote, 0
       )`,
      params
    );
  }

  const [rows] = await pool.query(
    `SELECT di.distItemProduto, p.prodDescricao AS distItemProdutoDescricao,
            COALESCE(u.uniDescricao, p.prodUnidMedConsumo) AS distItemProdutoUN,
            di.distItemQuantidade, di.distItemStatus, di.distItemValidade, di.distItemLote
     FROM trnsdistribuicaoitens di
     LEFT JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo
     WHERE di.prefCodigo = :prefCodigo AND di.distCodigo = :distCodigo AND di.distItemProduto = :distItemProduto`,
    { prefCodigo, distCodigo, distItemProduto }
  );
  return { data: rows[0] };
}

export async function deleteDistribuicaoItem(prefCodigo, distCodigo, distItemProduto) {
  const guia = await loadDistribuicao(prefCodigo, distCodigo);
  if (!guia) return { error: "Guia não encontrada", status: 404 };
  if (guia.distStatus === "C") return { error: "Guia cancelada", status: 400 };

  const [result] = await pool.query(
    `DELETE FROM trnsdistribuicaoitens
     WHERE prefCodigo = :prefCodigo AND distCodigo = :distCodigo AND distItemProduto = :distItemProduto`,
    { prefCodigo, distCodigo, distItemProduto: Number(distItemProduto) }
  );
  if (result.affectedRows === 0) return { error: "Item não encontrado", status: 404 };
  return { message: "Item excluído." };
}

export async function cancelDistribuicao(prefCodigo, distCodigo, body, req) {
  const user = auditUser(req);
  const motivo = String(body?.motivo || body?.distDSCancelamento || "Cancelamento via web").trim();
  const [result] = await pool.query(
    `UPDATE trnsdistribuicao SET distStatus = 'C', distDSCancelamento = :motivo,
       distUserName = :user, distDataAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND distCodigo = :distCodigo AND distStatus <> 'C'`,
    { prefCodigo, distCodigo, motivo, user }
  );
  if (result.affectedRows === 0) return { error: "Guia não encontrada ou já cancelada", status: 400 };
  return { data: await loadDistribuicao(prefCodigo, distCodigo), message: "Guia cancelada." };
}

// --- Distribuições (guia) ---
export async function loadDistribuicao(prefCodigo, distCodigo) {
  const [rows] = await pool.query(
    `SELECT d.distCodigo, d.distRemCodigo, d.distPeriodo, d.distDataEnvio, d.distDataRecepcao,
            d.distLocalOrigem, d.distLocalDestino, d.distRecebedor, d.distReceber, d.distStatus,
            d.distObservacao, d.distCodigoTipoRemessa, d.distRotaCodigo, d.distDataCadastro,
            lo.locDescricao AS distLocalOrigemNome, ld.locDescricao AS distLocalDestinoNome
     FROM trnsdistribuicao d
     LEFT JOIN trnslocal lo ON lo.prefCodigo = d.prefCodigo AND lo.locCodigo = d.distLocalOrigem
     LEFT JOIN trnslocal ld ON ld.prefCodigo = d.prefCodigo AND ld.locCodigo = d.distLocalDestino
     WHERE d.prefCodigo = :prefCodigo AND d.distCodigo = :distCodigo`,
    { prefCodigo, distCodigo }
  );
  return rows[0] ?? null;
}

export async function updateDistribuicao(prefCodigo, distCodigo, body, req) {
  const guia = await loadDistribuicao(prefCodigo, distCodigo);
  if (!guia) return { error: "Guia não encontrada", status: 404 };
  if (guia.distStatus === "C") return { error: "Guia cancelada", status: 400 };

  const distReceber = body.distReceber === "S" ? "S" : body.distReceber === "N" ? "N" : guia.distReceber || "N";
  const distRecebedor = body.distRecebedor != null ? String(body.distRecebedor) : guia.distRecebedor;
  const distObservacao = body.distObservacao != null ? String(body.distObservacao) : guia.distObservacao;
  const distDataRecepcao = body.distDataRecepcao !== undefined ? body.distDataRecepcao || null : guia.distDataRecepcao;
  const user = auditUser(req);

  await pool.query(
    `UPDATE trnsdistribuicao SET
       distDataRecepcao = :distDataRecepcao,
       distRecebedor = :distRecebedor,
       distReceber = :distReceber,
       distObservacao = :distObservacao,
       distUserName = :user,
       distDataAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND distCodigo = :distCodigo`,
    { prefCodigo, distCodigo, distDataRecepcao, distRecebedor, distReceber, distObservacao, user }
  );
  return { data: await loadDistribuicao(prefCodigo, distCodigo) };
}

export async function listDistribuicaoProdutosQuery(prefCodigo, reqQuery) {
  const q = String(reqQuery.q || "").trim();
  const status = reqQuery.status;
  const where = ["dp.prefCodigo = :prefCodigo"];
  const params = { prefCodigo };

  if (status) {
    where.push("dp.distProdutoStatus = :status");
    params.status = status;
  }
  if (q) {
    where.push(
      `(dp.distProdutoDescricao LIKE :q OR dp.distProdutoDisDestino LIKE :q OR CAST(dp.distCodigo AS CHAR) LIKE :q OR CAST(dp.distProdutoCodigo AS CHAR) LIKE :q)`
    );
    params.q = `%${q}%`;
  }

  const sortMap = {
    distProdutoRemessa: "d.distRemCodigo",
    distCodigo: "dp.distCodigo",
    distProdutoDistData: "dp.distProdutoDistData",
    distRota: "dp.distRota",
    distProdutoCodigo: "dp.distProdutoCodigo",
    distProdutoDescricao: "dp.distProdutoDescricao",
    distProdutoUN: "dp.distProdutoUN",
    distProdutoQuantidade: "dp.distProdutoQuantidade",
    distProdutoPesoTotal: "dp.distProdutoPesoTotal",
    distProdutoValidade: "dp.distProdutoValidade",
    distProdutoLote: "dp.distProdutoLote",
    distProdutoDisDestino: "dp.distProdutoDisDestino",
    distProdutoStatus: "dp.distProdutoStatus",
  };

  const orderBy = sortMap[reqQuery.orderBy] || "dp.distProdutoDescricao";
  const orderDir = String(reqQuery.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  return paginatedList(pool, {
    select: `dp.distCodigo, dp.prefCodigo, dp.distProdutoCodigo, dp.distProdutoDescricao, dp.distProdutoUN,
             dp.distProdutoQuantidade, dp.distProdutoPesoTotal, dp.distProdutoValidade, dp.distProdutoLote,
             dp.distProdutoDisDestino, dp.distProdutoDistData, dp.distRota, dp.distProdutoStatus,
             d.distRemCodigo AS distProdutoRemessa,
             COALESCE(r.rotaDescricao, CAST(dp.distRota AS CHAR)) AS distRotaDescricao`,
    from: `FROM trnsdistribuicaoprodutos dp
           LEFT JOIN trnsdistribuicao d ON d.prefCodigo = dp.prefCodigo AND d.distCodigo = dp.distCodigo
           LEFT JOIN trnsrota r ON r.prefCodigo = dp.prefCodigo AND r.rotaCodigo = dp.distRota`,
    where,
    params,
    orderBy,
    orderDir,
    page: reqQuery.page,
    limit: reqQuery.limit,
  });
}

/** Alimentos do assistente rancho — espelha RanchoWizardPlanilhaAlimentos. */
export async function loadRanchoWizardAlimentos(prefCodigo, options = {}) {
  const { dataInicial, dataFinal, prodCodigoTipoRemessa } = options;
  const params = { prefCodigo };
  let dateFilter = "";
  if (dataInicial && dataFinal) {
    dateFilter = " AND cp.carPratoData >= :dataInicial AND cp.carPratoData <= :dataFinal";
    params.dataInicial = dataInicial;
    params.dataFinal = dataFinal;
  }

  const [pratoRows] = await pool.query(
    `SELECT DISTINCT cp.carPratoRefeicao AS pratoCodigo
     FROM trnscardapioprato cp
     WHERE cp.prefCodigo = :prefCodigo${dateFilter}`,
    params
  );
  const pratoIds = pratoRows.map((r) => r.pratoCodigo).filter(Boolean);

  let prodIds = [];
  if (pratoIds.length) {
    const placeholders = pratoIds.map(() => "?").join(",");
    const [ingRows] = await pool.query(
      `SELECT DISTINCT pi.pratIngrProdCodigo AS prodCodigo
       FROM trnspratosingredientes pi
       WHERE pi.prefCodigo = ? AND pi.pratoCodigo IN (${placeholders})`,
      [prefCodigo, ...pratoIds]
    );
    prodIds = ingRows.map((r) => r.prodCodigo).filter(Boolean);
  }

  const prodParams = { prefCodigo };
  const where = ["p.prefCodigo = :prefCodigo", "p.prodStatus = 'A'", "p.prodSaldo > 0"];
  if (prodIds.length) {
    where.push(`p.prodCodigo IN (${prodIds.map((_, i) => `:prod${i}`).join(",")})`);
    prodIds.forEach((id, i) => {
      prodParams[`prod${i}`] = id;
    });
  }
  if (prodCodigoTipoRemessa) {
    where.push("p.prodCodigoTipoRemessa = :prodCodigoTipoRemessa");
    prodParams.prodCodigoTipoRemessa = Number(prodCodigoTipoRemessa);
  }

  const [rows] = await pool.query(
    `SELECT p.prodCodigo, p.prodDescricao, p.prodSaldo, p.prodPesoConsumo, p.prodCodigoTipoRemessa,
            COALESCE(NULLIF(TRIM(p.prodObsConsumo), ''), u.uniFracao) AS uniDescricao,
            IF(p.prodPesoConsumo = 0, 1, p.prodPesoConsumo) AS qtdeEmbalagem
     FROM trnsprodutos p
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo
     WHERE ${where.join(" AND ")}
     ORDER BY p.prodDescricao`,
    prodParams
  );

  const prodIdSet = new Set(prodIds);
  return rows.map((r) => ({
    prodCodigo: r.prodCodigo,
    prodDescricao: r.prodDescricao,
    prodSaldo: r.prodSaldo,
    prodCodigoTipoRemessa: r.prodCodigoTipoRemessa,
    uniDescricao: r.uniDescricao,
    qtdeEmbalagem: r.qtdeEmbalagem,
    prodPesoConsumo: r.prodPesoConsumo,
    selected: prodIdSet.has(r.prodCodigo),
  }));
}

/** Prévia de guias do rancho fixo: qtde = max(qtdeFixa - estoque UE, 0). */
export async function loadRanchoFixoGuiasPreview(prefCodigo, locCodigos, prodCodigos) {
  const locs = [...new Set((locCodigos || []).map(Number).filter(Boolean))];
  const prods = [...new Set((prodCodigos || []).map(Number).filter(Boolean))];
  if (!locs.length || !prods.length) return [];

  const params = { prefCodigo };
  const locPh = locs.map((c, i) => {
    params[`loc${i}`] = c;
    return `:loc${i}`;
  }).join(",");
  const prodPh = prods.map((c, i) => {
    params[`prod${i}`] = c;
    return `:prod${i}`;
  }).join(",");

  const [rows] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao, p.prodCodigo, p.prodDescricao,
            COALESCE(e.estoUEQtdeFixa, 0) AS qtdeFixa,
            COALESCE(e.estoUeSaldo, 0) AS estoque,
            GREATEST(COALESCE(e.estoUEQtdeFixa, 0) - COALESCE(e.estoUeSaldo, 0), 0) AS quantidade
     FROM trnslocal l
     INNER JOIN trnsprodutos p ON p.prefCodigo = l.prefCodigo AND p.prodCodigo IN (${prodPh})
     LEFT JOIN TRNSEstoqueUE e
       ON e.prefCodigo = l.prefCodigo
      AND e.estoUeLocCodigo = l.locCodigo
      AND e.estoUeProdCodigo = p.prodCodigo
     WHERE l.prefCodigo = :prefCodigo
       AND l.locCodigo IN (${locPh})
     ORDER BY l.locDescricao, p.prodDescricao`,
    params
  );

  return rows.map((r) => {
    const qtdeFixa = Number(r.qtdeFixa) || 0;
    const estoque = Number(r.estoque) || 0;
    const bruto = qtdeFixa - estoque;
    return {
      locCodigo: r.locCodigo,
      locDescricao: r.locDescricao,
      prodCodigo: r.prodCodigo,
      prodDescricao: r.prodDescricao,
      qtdeFixa,
      estoque,
      quantidade: Math.max(0, bruto),
      temEstoque: bruto <= 0 && estoque > 0,
    };
  });
}

/** Locais para wizards rancho — espelha filtros GeneXus (rota, exclui tipos 2 e 9). */
export async function loadRanchoWizardLocais(prefCodigo, options = {}) {
  const rotaCodigos = (options.rotaCodigos || []).map(Number).filter(Boolean);
  const params = { prefCodigo };
  const where = [
    "l.prefCodigo = :prefCodigo",
    "l.locStatus = 'A'",
    "l.locNota > 0",
    "l.locTipoUnidade NOT IN (2, 9)",
  ];
  if (rotaCodigos.length) {
    where.push(`l.locNota IN (${rotaCodigos.map((_, i) => `:r${i}`).join(",")})`);
    rotaCodigos.forEach((c, i) => {
      params[`r${i}`] = c;
    });
  }

  const [rows] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao, l.locBairro, l.locNota, r.rotaDescricao
     FROM trnslocal l
     LEFT JOIN trnsrota r ON r.prefCodigo = l.prefCodigo AND r.rotaCodigo = l.locNota
     WHERE ${where.join(" AND ")}
     ORDER BY l.locDescricao`,
    params
  );
  return rows;
}

const PERCAPTA_AREA_CODES = [1, 2, 3, 4, 5, 99999997];

function buildPerCaptaPivotSelect() {
  const parts = PERCAPTA_AREA_CODES.flatMap((code) => [
    `MAX(CASE WHEN ra.RanchoAreasEnsinoCodigo = ${code} THEN ra.RanchoAreasEnsinoPerCaptaValor END) AS percapta_${code}`,
    `MAX(CASE WHEN ra.RanchoAreasEnsinoCodigo = ${code} THEN ra.RanchoAreasEnsinoPerCaptaOfert END) AS oferta_${code}`,
  ]);
  return parts.join(",\n             ");
}

/** Listagem AjustePerCaptas — produtos com percapta/oferta por área no mês/ano. */
export async function listAjustePerCaptasQuery(prefCodigo, reqQuery) {
  const mes = Number(reqQuery.mes) || new Date().getMonth() + 1;
  const ano = Number(reqQuery.ano) || new Date().getFullYear();
  const q = String(reqQuery.q || "").trim();
  const classificacao = reqQuery.classificacao;
  const where = ["p.prefCodigo = :prefCodigo", "p.prodStatus = 'A'"];
  const params = { prefCodigo, mes, ano };

  if (classificacao) {
    where.push("p.prodClassificacao = :classificacao");
    params.classificacao = classificacao;
  }
  if (q) {
    where.push("(p.prodDescricao LIKE :q OR CAST(p.prodCodigo AS CHAR) LIKE :q)");
    params.q = `%${q}%`;
  }

  const orderByKey = reqQuery.orderBy || "prodDescricao";
  const sortMap = {
    prodCodigo: "p.prodCodigo",
    prodDescricao: "p.prodDescricao",
    prodClassificacao: "p.prodClassificacao",
  };
  const orderBy = sortMap[orderByKey] || "p.prodDescricao";
  const orderDir = String(reqQuery.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  return paginatedList(pool, {
    select: `p.prodCodigo, p.prodDescricao, p.prodClassificacao, p.prodCodigoTipoRemessa, p.prodStatus,
             ${buildPerCaptaPivotSelect()}`,
    from: `FROM trnsprodutos p
           LEFT JOIN ranchoareasensinopercapta ra
             ON ra.prefCodigo = p.prefCodigo AND ra.prodCodigo = p.prodCodigo
            AND ra.RanchoAno = :ano AND ra.RanchoMes = :mes`,
    where,
    params,
    orderBy,
    orderDir,
    page: reqQuery.page,
    limit: reqQuery.limit,
    groupBy: "p.prodCodigo, p.prodDescricao, p.prodClassificacao, p.prodCodigoTipoRemessa, p.prodStatus",
  });
}

function mapPerCaptaRow(row) {
  return {
    prodCodigo: row.prodCodigo,
    prodDescricao: row.prodDescricao,
    prodClassificacao: row.prodClassificacao,
    prodCodigoTipoRemessa: row.prodCodigoTipoRemessa,
    prodStatus: row.prodStatus,
    bercario1: row.percapta_1 ?? 0,
    bercario1Oferta: row.oferta_1 ?? 0,
    bercario2: row.percapta_2 ?? 0,
    bercario2Oferta: row.oferta_2 ?? 0,
    creche: row.percapta_3 ?? 0,
    crecheOferta: row.oferta_3 ?? 0,
    emeb: row.percapta_4 ?? 0,
    emebOferta: row.oferta_4 ?? 0,
    integral: row.percapta_5 ?? 0,
    integralOferta: row.oferta_5 ?? 0,
    funcionarios: row.percapta_99999997 ?? 0,
    funcionariosOferta: row.oferta_99999997 ?? 0,
  };
}

export async function listAjustePerCaptas(prefCodigo, reqQuery) {
  const result = await listAjustePerCaptasQuery(prefCodigo, reqQuery);
  return {
    ...result,
    data: result.data.map(mapPerCaptaRow),
    meta: { ...result.meta, mes: Number(reqQuery.mes), ano: Number(reqQuery.ano) },
  };
}

/** Grava linha AjustePerCaptas (AjustesPerCaptaGravaDados modo UPD). */
export async function saveAjustePerCaptaRow(prefCodigo, body) {
  const mes = Number(body.mes);
  const ano = Number(body.ano);
  const prodCodigo = Number(body.prodCodigo);
  if (!mes || !ano || !prodCodigo) {
    return { error: "Mês, ano e produto são obrigatórios", status: 400 };
  }

  if (body.prodCodigoTipoRemessa !== undefined && body.prodCodigoTipoRemessa !== "") {
    await pool.query(
      `UPDATE trnsprodutos SET prodCodigoTipoRemessa = :tipo
       WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      {
        prefCodigo,
        prodCodigo,
        tipo: Number(body.prodCodigoTipoRemessa) || 0,
      }
    );
  }

  const areas = [
    [1, body.bercario1, body.bercario1Oferta],
    [2, body.bercario2, body.bercario2Oferta],
    [3, body.creche, body.crecheOferta],
    [4, body.emeb, body.emebOferta],
    [5, body.integral, body.integralOferta],
    [99999997, body.funcionarios, body.funcionariosOferta],
  ];

  for (const [areaCode, valor, oferta] of areas) {
    if (valor === undefined && oferta === undefined) continue;
    const v = Number(valor) || 0;
    const o = Number(oferta) || 0;
    await pool.query(
      `INSERT INTO ranchoareasensinopercapta
         (prefCodigo, RanchoAno, RanchoMes, RanchoAreasEnsinoCodigo, prodCodigo,
          RanchoAreasEnsinoPerCaptaValor, RanchoAreasEnsinoPerCaptaOfert)
       VALUES (:prefCodigo, :ano, :mes, :areaCode, :prodCodigo, :valor, :oferta)
       ON DUPLICATE KEY UPDATE
         RanchoAreasEnsinoPerCaptaValor = :valor,
         RanchoAreasEnsinoPerCaptaOfert = :oferta`,
      { prefCodigo, ano, mes, areaCode, prodCodigo, valor: v, oferta: o }
    );
  }

  return { ok: true };
}

// --- Romaneio ---
export async function loadRomaneio(prefCodigo, romanCodigo) {
  const [rows] = await pool.query(
    `SELECT r.romanCodigo, r.romanData, r.forCodigo, r.romanLocal, r.notaCodigo,
            f.forNome, n.notaNumero, n.notaSerie, n.notaData,
            l.locDescricao AS romanLocalDescricao
     FROM Romaneio r
     LEFT JOIN trnsfornecedores f ON f.prefCodigo = r.prefCodigo AND f.forCodigo = r.forCodigo
     LEFT JOIN trnsnota n ON n.prefCodigo = r.prefCodigo AND n.notaCodigo = r.notaCodigo
     LEFT JOIN trnslocal l ON l.prefCodigo = r.prefCodigo AND l.locCodigo = r.romanLocal
     WHERE r.prefCodigo = :prefCodigo AND r.romanCodigo = :romanCodigo`,
    { prefCodigo, romanCodigo }
  );
  return rows[0] ?? null;
}

export async function listRomaneioItens(prefCodigo, romanCodigo, opts = {}) {
  const paginate = opts.page != null || opts.limit != null || opts.q;
  const baseSql = `
     FROM RomaneioItem ri
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ri.prefCodigo AND p.prodCodigo = ri.prodCodigo
     LEFT JOIN trnsunidades u ON u.prefCodigo = ri.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra
     WHERE ri.prefCodigo = :prefCodigo AND ri.romanCodigo = :romanCodigo`;
  const selectSql = `
     SELECT ri.prodCodigo, p.prodDescricao, p.prodUnidMedCompra,
            u.uniDescricao AS prodUnidMedCompraDesc,
            ri.romanItemQuantidade, ri.romanItemQuantidadeAntes`;

  if (!paginate) {
    const [rows] = await pool.query(
      `${selectSql} ${baseSql} ORDER BY p.prodDescricao`,
      { prefCodigo, romanCodigo }
    );
    return rows;
  }

  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(opts.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(opts.q || "").trim();
  const params = { prefCodigo, romanCodigo, limit, offset };
  let filterSql = "";
  if (q) {
    filterSql = " AND (p.prodDescricao LIKE :q OR CAST(ri.prodCodigo AS CHAR) LIKE :qLike)";
    params.q = `%${q}%`;
    params.qLike = `%${q}%`;
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseSql}${filterSql}`, params);
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await pool.query(
    `${selectSql} ${baseSql}${filterSql}
     ORDER BY p.prodDescricao
     LIMIT :limit OFFSET :offset`,
    params
  );

  return {
    data: rows,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function upsertRomaneioItem(prefCodigo, romanCodigo, body, req) {
  const { ensureRomaneioItemTriggers, lancarEstoqueRomaneio } = await import("./estoqueMovimentacaoService.js");
  await ensureRomaneioItemTriggers();

  const romaneio = await loadRomaneio(prefCodigo, romanCodigo);
  if (!romaneio) return { error: "Romaneio não encontrado", status: 404 };
  if (romaneio.notaCodigo) return { error: "Romaneio com nota vinculada não permite alterar itens", status: 400 };

  const prodCodigo = Number(body.prodCodigo);
  const romanItemQuantidade = Number(body.romanItemQuantidade);
  if (!prodCodigo) return { error: "Produto é obrigatório", status: 400 };
  if (Number.isNaN(romanItemQuantidade) || romanItemQuantidade <= 0) {
    return { error: "Quantidade é obrigatória", status: 400 };
  }

  const userName = req?.user?.usuUsuario || req?.user?.usuNome || "web";

  const [existing] = await pool.query(
    `SELECT romanItemQuantidade, romanItemQuantidadeAntes FROM RomaneioItem
     WHERE prefCodigo = :prefCodigo AND romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo`,
    { prefCodigo, romanCodigo, prodCodigo }
  );

  const qtdeAnterior = existing.length ? Number(existing[0].romanItemQuantidade) || 0 : 0;

  try {
    if (existing.length) {
      await pool.query(
        `UPDATE RomaneioItem SET romanItemQuantidade = :romanItemQuantidade
         WHERE prefCodigo = :prefCodigo AND romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo`,
        { prefCodigo, romanCodigo, prodCodigo, romanItemQuantidade }
      );
    } else {
      await pool.query(
        `INSERT INTO RomaneioItem (prefCodigo, romanCodigo, prodCodigo, romanItemQuantidade, romanItemQuantidadeAntes)
         VALUES (:prefCodigo, :romanCodigo, :prodCodigo, :romanItemQuantidade, 0)`,
        { prefCodigo, romanCodigo, prodCodigo, romanItemQuantidade }
      );
    }
  } catch (err) {
    if (err.code === "ER_NO_SUCH_USER") {
      await ensureRomaneioItemTriggers();
      return {
        error: "Trigger de romaneio com definer inválido. Execute: node scripts/fix-romaneioitem-triggers.mjs",
        status: 500,
      };
    }
    throw err;
  }

  if (!romaneio.notaCodigo) {
    await lancarEstoqueRomaneio(prefCodigo, {
      romanCodigo,
      prodCodigo,
      romanLocal: romaneio.romanLocal,
      quantidade: romanItemQuantidade,
      situacao: "N",
      qtdeAnterior,
      userName,
    });
  }

  return { ok: true };
}

export async function deleteRomaneioItem(prefCodigo, romanCodigo, prodCodigo, req) {
  const { ensureRomaneioItemTriggers, lancarEstoqueRomaneio } = await import("./estoqueMovimentacaoService.js");
  await ensureRomaneioItemTriggers();

  const romaneio = await loadRomaneio(prefCodigo, romanCodigo);
  if (!romaneio) return { error: "Romaneio não encontrado", status: 404 };
  if (romaneio.notaCodigo) return { error: "Romaneio com nota vinculada não permite eliminar itens", status: 400 };

  const [rows] = await pool.query(
    `SELECT romanItemQuantidade FROM RomaneioItem
     WHERE prefCodigo = :prefCodigo AND romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo`,
    { prefCodigo, romanCodigo, prodCodigo: Number(prodCodigo) }
  );
  if (!rows.length) return { error: "Item não encontrado", status: 404 };

  const qtdeAnterior = Number(rows[0].romanItemQuantidade) || 0;
  const userName = req?.user?.usuUsuario || req?.user?.usuNome || "web";

  try {
    const [result] = await pool.query(
      `DELETE FROM RomaneioItem
       WHERE prefCodigo = :prefCodigo AND romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo`,
      { prefCodigo, romanCodigo, prodCodigo: Number(prodCodigo) }
    );
    if (result.affectedRows === 0) return { error: "Item não encontrado", status: 404 };
  } catch (err) {
    if (err.code === "ER_NO_SUCH_USER") {
      return {
        error: "Trigger de romaneio com definer inválido. Execute: node scripts/fix-romaneioitem-triggers.mjs",
        status: 500,
      };
    }
    throw err;
  }

  if (!romaneio.notaCodigo && qtdeAnterior > 0) {
    await lancarEstoqueRomaneio(prefCodigo, {
      romanCodigo,
      prodCodigo: Number(prodCodigo),
      romanLocal: romaneio.romanLocal,
      quantidade: qtdeAnterior,
      situacao: "I",
      qtdeAnterior,
      userName,
    });
  }

  return { ok: true };
}

export async function createRomaneio(prefCodigo, body, req) {
  const romanData = body.romanData;
  const forCodigo = Number(body.forCodigo);
  const romanLocal = Number(body.romanLocal);

  if (!romanData) return { error: "Data é obrigatória" };
  if (!forCodigo) return { error: "Fornecedor é obrigatório" };
  if (!romanLocal) return { error: "Local de estoque é obrigatório" };

  const romanCodigo = await nextCode(prefCodigo, "Romaneio", "romanCodigo");
  const user = auditUser(req);
  const notaCodigo = body.notaCodigo != null && body.notaCodigo !== "" ? Number(body.notaCodigo) : null;

  await pool.query(
    `INSERT INTO Romaneio (
       prefCodigo, romanCodigo, romanData, forCodigo, romanLocal, notaCodigo,
       romanDataCadastro, romanDataAlteracao, romanUserName
     ) VALUES (
       :prefCodigo, :romanCodigo, :romanData, :forCodigo, :romanLocal, :notaCodigo,
       NOW(), NOW(), :user
     )`,
    { prefCodigo, romanCodigo, romanData, forCodigo, romanLocal, notaCodigo, user }
  );
  return { data: await loadRomaneio(prefCodigo, romanCodigo) };
}

export async function updateRomaneio(prefCodigo, romanCodigo, body, req) {
  const romanData = body.romanData;
  const forCodigo = Number(body.forCodigo);
  const romanLocal = Number(body.romanLocal);

  if (!romanData) return { error: "Data é obrigatória" };
  if (!forCodigo) return { error: "Fornecedor é obrigatório" };
  if (!romanLocal) return { error: "Local de estoque é obrigatório" };

  const user = auditUser(req);
  const notaCodigo = body.notaCodigo != null && body.notaCodigo !== "" ? Number(body.notaCodigo) : null;

  const [result] = await pool.query(
    `UPDATE Romaneio SET
       romanData = :romanData, forCodigo = :forCodigo, romanLocal = :romanLocal,
       notaCodigo = :notaCodigo, romanDataAlteracao = NOW(), romanUserName = :user
     WHERE prefCodigo = :prefCodigo AND romanCodigo = :romanCodigo`,
    { prefCodigo, romanCodigo, romanData, forCodigo, romanLocal, notaCodigo, user }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadRomaneio(prefCodigo, romanCodigo) };
}

// --- Cronograma ---
export async function loadCronograma(prefCodigo, croCodigo) {
  const [rows] = await pool.query(
    `SELECT c.croCodigo, c.forCodigo, c.prodCodigo, c.croMarca, c.croDtInicial, c.croDtFinal,
            c.croNumeroNota, c.croStatus, c.croRemessa, c.croTipoRemessa, c.croDtConsumo,
            f.forNome, p.prodDescricao, t.disTipDescricao AS croTipoRemessaDesc,
            (SELECT COALESCE(SUM(cl.croLocQtde), 0) FROM trnscronogramalocal cl
             WHERE cl.prefCodigo = c.prefCodigo AND cl.croCodigo = c.croCodigo) AS croTotal
     FROM trnscronograma c
     LEFT JOIN trnsfornecedores f ON f.prefCodigo = c.prefCodigo AND f.forCodigo = c.forCodigo
     LEFT JOIN trnsprodutos p ON p.prefCodigo = c.prefCodigo AND p.prodCodigo = c.prodCodigo
     LEFT JOIN trnsdistribuicaotipo t ON t.prefCodigo = c.prefCodigo AND t.disTipNumero = c.croTipoRemessa
     WHERE c.prefCodigo = :prefCodigo AND c.croCodigo = :croCodigo`,
    { prefCodigo, croCodigo }
  );
  return rows[0] ?? null;
}

export async function createCronograma(prefCodigo, body, req) {
  const forCodigo = Number(body.forCodigo);
  const prodCodigo = Number(body.prodCodigo);
  if (!forCodigo) return { error: "Fornecedor é obrigatório" };
  if (!prodCodigo) return { error: "Produto é obrigatório" };
  if (!body.croMarca || !String(body.croMarca).trim()) return { error: "Marca do produto é obrigatória" };
  if (!body.croDtInicial || !body.croDtFinal) return { error: "Informe a data inicial e a data final" };
  if (String(body.croDtInicial) > String(body.croDtFinal)) return { error: "Data inicial é maior que a data final" };
  if (Number(body.croRemessa) === 0 && body.croStatus === "D") {
    return { error: "Não é possível salvar com status de DISTRIBUIÇÃO sem informar o código da remessa" };
  }

  const croCodigo = await nextCode(prefCodigo, "trnscronograma", "croCodigo");
  const user = auditUser(req);
  const croStatus = body.croStatus != null ? String(body.croStatus) : "A";

  await pool.query(
    `INSERT INTO trnscronograma (
       prefCodigo, croCodigo, forCodigo, prodCodigo, croMarca, croDtInicial, croDtFinal,
       croNumeroNota, croStatus, croRemessa, croDataCad, croDataAlt, croUsuario, croFeito,
       croTipoRemessa, croDtConsumo
     ) VALUES (
       :prefCodigo, :croCodigo, :forCodigo, :prodCodigo, :croMarca, :croDtInicial, :croDtFinal,
       :croNumeroNota, :croStatus, :croRemessa, NOW(), NOW(), :user, 'N',
       :croTipoRemessa, :croDtConsumo
     )`,
    {
      prefCodigo,
      croCodigo,
      forCodigo,
      prodCodigo,
      croMarca: body.croMarca != null ? String(body.croMarca) : "",
      croDtInicial: body.croDtInicial || null,
      croDtFinal: body.croDtFinal || null,
      croNumeroNota: body.croNumeroNota != null && body.croNumeroNota !== "" ? String(body.croNumeroNota) : "",
      croStatus,
      croRemessa: Number(body.croRemessa) || 0,
      croTipoRemessa: body.croTipoRemessa != null && body.croTipoRemessa !== "" ? Number(body.croTipoRemessa) : null,
      croDtConsumo: body.croDtConsumo || null,
      user,
    }
  );
  return { data: await loadCronograma(prefCodigo, croCodigo) };
}

export async function updateCronograma(prefCodigo, croCodigo, body, req) {
  const forCodigo = Number(body.forCodigo);
  const prodCodigo = Number(body.prodCodigo);
  if (!forCodigo) return { error: "Fornecedor é obrigatório" };
  if (!prodCodigo) return { error: "Produto é obrigatório" };

  const user = auditUser(req);
  const croStatus = body.croStatus != null ? String(body.croStatus) : "A";

  const [result] = await pool.query(
    `UPDATE trnscronograma SET
       forCodigo = :forCodigo, prodCodigo = :prodCodigo, croMarca = :croMarca,
       croDtInicial = :croDtInicial, croDtFinal = :croDtFinal, croNumeroNota = :croNumeroNota,
       croStatus = :croStatus, croRemessa = :croRemessa, croTipoRemessa = :croTipoRemessa,
       croDtConsumo = :croDtConsumo, croDataAlt = NOW(), croUsuario = :user
     WHERE prefCodigo = :prefCodigo AND croCodigo = :croCodigo`,
    {
      prefCodigo,
      croCodigo,
      forCodigo,
      prodCodigo,
      croMarca: body.croMarca != null ? String(body.croMarca) : "",
      croDtInicial: body.croDtInicial || null,
      croDtFinal: body.croDtFinal || null,
      croNumeroNota: body.croNumeroNota != null && body.croNumeroNota !== "" ? String(body.croNumeroNota) : "",
      croStatus,
      croRemessa: Number(body.croRemessa) || 0,
      croTipoRemessa: body.croTipoRemessa != null && body.croTipoRemessa !== "" ? Number(body.croTipoRemessa) : null,
      croDtConsumo: body.croDtConsumo || null,
      user,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadCronograma(prefCodigo, croCodigo) };
}

export async function duplicateCronograma(prefCodigo, croCodigo, req) {
  const source = await loadCronograma(prefCodigo, croCodigo);
  if (!source) return { error: "Cronograma não encontrado", status: 404 };

  const newCodigo = await nextCode(prefCodigo, "trnscronograma", "croCodigo");
  const user = auditUser(req);

  await pool.query(
    `INSERT INTO trnscronograma (
       prefCodigo, croCodigo, forCodigo, prodCodigo, croMarca, croDtInicial, croDtFinal,
       croNumeroNota, croStatus, croRemessa, croDataCad, croDataAlt, croUsuario, croFeito,
       croTipoRemessa, croDtConsumo
     ) VALUES (
       :prefCodigo, :newCodigo, :forCodigo, :prodCodigo, :croMarca, :croDtInicial, :croDtFinal,
       :croNumeroNota, 'C', 0, NOW(), NOW(), :user, 'N', :croTipoRemessa, :croDtConsumo
     )`,
    {
      prefCodigo,
      newCodigo,
      forCodigo: source.forCodigo,
      prodCodigo: source.prodCodigo,
      croMarca: source.croMarca ?? "",
      croDtInicial: source.croDtInicial,
      croDtFinal: source.croDtFinal,
      croNumeroNota: source.croNumeroNota ?? "",
      croTipoRemessa: source.croTipoRemessa,
      croDtConsumo: source.croDtConsumo,
      user,
    }
  );

  const [locais] = await pool.query(
    `SELECT croLocCodigo, croDia, croLocSeq, croHora, croLocQtde
     FROM trnscronogramalocal
     WHERE prefCodigo = :prefCodigo AND croCodigo = :croCodigo`,
    { prefCodigo, croCodigo }
  );

  for (const loc of locais) {
    await pool.query(
      `INSERT INTO trnscronogramalocal (prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq, croHora, croLocQtde)
       VALUES (:prefCodigo, :newCodigo, :croLocCodigo, :croDia, :croLocSeq, :croHora, :croLocQtde)`,
      {
        prefCodigo,
        newCodigo,
        croLocCodigo: loc.croLocCodigo,
        croDia: loc.croDia,
        croLocSeq: loc.croLocSeq ?? 0,
        croHora: loc.croHora,
        croLocQtde: loc.croLocQtde,
      }
    );
  }

  return { message: "Duplicação realizada com sucesso.", data: await loadCronograma(prefCodigo, newCodigo) };
}

const CRO_DIA_LABELS = { 0: "Nenhum", 2: "Segunda", 3: "Terça", 4: "Quarta", 5: "Quinta", 6: "Sexta", 7: "Sábado" };

export async function listCronogramaLocais(prefCodigo, croCodigo, opts = {}) {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(opts.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(opts.q || "").trim();
  const params = { prefCodigo, croCodigo, limit, offset };
  let filterSql = "";
  if (q) {
    filterSql = " AND (l.locDescricao LIKE :q OR CAST(cl.croLocCodigo AS CHAR) LIKE :qLike)";
    params.q = `%${q}%`;
    params.qLike = `%${q}%`;
  }

  const baseFrom = `
     FROM trnscronogramalocal cl
     LEFT JOIN trnslocal l ON l.prefCodigo = cl.prefCodigo AND l.locCodigo = cl.croLocCodigo
     LEFT JOIN trnsrota r ON r.prefCodigo = l.prefCodigo AND r.rotaCodigo = l.locNota
     WHERE cl.prefCodigo = :prefCodigo AND cl.croCodigo = :croCodigo`;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseFrom}${filterSql}`, params);
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await pool.query(
    `SELECT cl.croLocCodigo, cl.croLocSeq, l.locDescricao, cl.croDia, cl.croHora, cl.croLocQtde,
            r.rotaDescricao, l.locNota AS croRotaCodigo
     ${baseFrom}${filterSql}
     ORDER BY l.locDescricao, cl.croDia, cl.croHora, cl.croLocSeq
     LIMIT :limit OFFSET :offset`,
    params
  );

  return {
    data: rows.map((r) => ({
      ...r,
      croDiaLabel: CRO_DIA_LABELS[Number(r.croDia)] ?? String(r.croDia),
    })),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    cronograma: await loadCronograma(prefCodigo, croCodigo),
  };
}

export async function upsertCronogramaLocal(prefCodigo, croCodigo, body) {
  const croLocCodigo = Number(body.croLocCodigo);
  const croDia = body.croDia != null ? String(body.croDia) : "0";
  if (!croLocCodigo) return { error: "Unidade é obrigatória", status: 400 };

  const croHora = body.croHora || null;
  const croLocQtde = body.croLocQtde != null ? Number(body.croLocQtde) : null;
  const isEdit = body.croLocSeq != null && body.croLocSeq !== "";
  let croLocSeq = isEdit ? Number(body.croLocSeq) : null;

  if (isEdit) {
    const [result] = await pool.query(
      `UPDATE trnscronogramalocal SET croHora = :croHora, croLocQtde = :croLocQtde
       WHERE prefCodigo = :prefCodigo AND croCodigo = :croCodigo
         AND croLocCodigo = :croLocCodigo AND croDia = :croDia AND croLocSeq = :croLocSeq`,
      { prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq, croHora, croLocQtde }
    );
    if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
    return { ok: true };
  }

  const [maxRows] = await pool.query(
    `SELECT COALESCE(MAX(croLocSeq), -1) + 1 AS nextSeq FROM trnscronogramalocal
     WHERE prefCodigo = :prefCodigo AND croCodigo = :croCodigo
       AND croLocCodigo = :croLocCodigo AND croDia = :croDia`,
    { prefCodigo, croCodigo, croLocCodigo, croDia }
  );
  croLocSeq = Number(maxRows[0]?.nextSeq) || 0;

  await pool.query(
    `INSERT INTO trnscronogramalocal (prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq, croHora, croLocQtde)
     VALUES (:prefCodigo, :croCodigo, :croLocCodigo, :croDia, :croLocSeq, :croHora, :croLocQtde)`,
    { prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq, croHora, croLocQtde }
  );
  return { ok: true, data: { croLocSeq } };
}

export async function deleteCronogramaLocal(prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq = 0) {
  const [result] = await pool.query(
    `DELETE FROM trnscronogramalocal
     WHERE prefCodigo = :prefCodigo AND croCodigo = :croCodigo
       AND croLocCodigo = :croLocCodigo AND croDia = :croDia AND croLocSeq = :croLocSeq`,
    {
      prefCodigo,
      croCodigo,
      croLocCodigo: Number(croLocCodigo),
      croDia: String(croDia),
      croLocSeq: Number(croLocSeq) || 0,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { ok: true };
}

// --- Referências ---
export async function listLogisticaReferencias(prefCodigo) {
  const [fornecedores] = await pool.query(
    `SELECT forCodigo, forNome, forAbreviatura FROM trnsfornecedores
     WHERE prefCodigo = :prefCodigo AND forStatus = 'A' ORDER BY forNome`,
    { prefCodigo }
  );
  const [rotas] = await pool.query(
    `SELECT rotaCodigo, rotaDescricao FROM trnsrota
     WHERE prefCodigo = :prefCodigo AND rotaStatus = 'A' ORDER BY rotaDescricao`,
    { prefCodigo }
  );
  const [tipos] = await pool.query(
    `SELECT disTipNumero, disTipCodigo, disTipDescricao FROM trnsdistribuicaotipo
     WHERE prefCodigo = :prefCodigo AND disTipStatus = 'A' ORDER BY disTipDescricao`,
    { prefCodigo }
  );
  const [locais] = await pool.query(
    `SELECT locCodigo, locDescricao FROM trnslocal
     WHERE prefCodigo = :prefCodigo AND locStatus = 'A' ORDER BY locDescricao`,
    { prefCodigo }
  );
  const [produtos] = await pool.query(
    `SELECT prodCodigo, prodDescricao, prodUnidMedCompra FROM trnsprodutos
     WHERE prefCodigo = :prefCodigo AND prodStatus = 'A' ORDER BY prodDescricao`,
    { prefCodigo }
  );
  return { fornecedores, rotas, tipos, locais, produtos };
}
