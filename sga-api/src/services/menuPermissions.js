import { pool, gamPool } from "../db.js";

/** Catálogo espelhando MENU_SECTIONS do front-end. */
export const MENU_CATALOG = [
  { section: "Cadastro", items: [
    { id: "alimentos", label: "Alimentos", screen: "produtos" },
    { id: "unidades", label: "Unidade", screen: "ww:unidades" },
    { id: "conversao-unidades", label: "Conversão de Unidades", screen: "ww:conv-qtdes" },
    { id: "locais", label: "Locais", screen: "ww:locais" },
    { id: "fornecedor", label: "Fornecedor", screen: "ww:fornecedores" },
    { id: "rotas", label: "Rotas", screen: "ww:rotas" },
    { id: "doencas", label: "Doenças", screen: "ww:doencas" },
    { id: "tipo-ajuste", label: "Tipo de Ajustes", screen: "ww:tipos-ajuste" },
  ]},
  { section: "Preparações", items: [
    { id: "refeicoes", label: "Refeições", screen: "ww:pratos" },
    { id: "tipo-refeicao", label: "Tipo de Refeição", screen: "ww:tipos-refeicao" },
    { id: "cardapios", label: "Cardápios", screen: "ww:cardapios" },
    { id: "grupo-cardapios", label: "Grupo de Cardápios", screen: "ww:cardapio-grupos" },
    { id: "atendimento", label: "Atendimento", screen: "ww:atendimentos" },
    { id: "calendario-letivo", label: "Calendário Letivo", screen: "ww:calendario-letivo" },
    { id: "acompanhamento-ue", label: "Acompanhamento da UE", screen: "ww:mapa-estoque" },
    { id: "lancar-qtd-fixa", label: "Lançar Quantidade Fixa", screen: "ww:qtde-fixa" },
  ]},
  { section: "Logística", items: [
    { id: "compras", label: "Compras", screen: "ww:compras" },
    { id: "tipo-distribuicao", label: "Tipo de Distribuição", screen: "ww:tipos-distribuicao" },
    { id: "guia-distribuicao", label: "Guia de Distribuição", screen: "ww:guia-distribuicao" },
    { id: "distribuicao-produtos", label: "Distribuição de Produtos", screen: "ww:distribuicao-produtos" },
    { id: "remessa", label: "Remessa", screen: "ww:remessa" },
    { id: "cancelamento-remessa", label: "Cancelamento de Remessa", screen: "ww:cancelamento-remessa" },
    { id: "romaneio", label: "Romaneio", screen: "ww:romaneio" },
    { id: "cronograma", label: "Cronograma", screen: "ww:cronograma" },
    { id: "largada", label: "Largada", screen: "ww:largada" },
    { id: "rancho-assistente", label: "Rancho Assistente", screen: "ww:rancho-assistente" },
    { id: "rancho-percapta", label: "Rancho PerCapta", screen: "ww:rancho-percapta" },
    { id: "rancho-fixo", label: "Rancho Fixo", screen: "ww:rancho-fixo" },
  ]},
  { section: "Estoque", items: [
    { id: "ajuste", label: "Ajuste", screen: "ww:ajuste" },
    { id: "inventario", label: "Inventário", screen: "ww:inventario" },
    { id: "posicao", label: "Posição", screen: "ww:posicao" },
    { id: "saldo", label: "Saldo", screen: "ww:saldo" },
    { id: "movimentacao", label: "Movimentação", screen: "ww:movimentacao" },
    { id: "apuracao-entrada-saida", label: "Apuração de Entrada e Saída", screen: "ww:apuracao-entrada-saida" },
    { id: "monitoramento-estoque-ue", label: "Monitoramento de Estoque das UE", screen: "ww:monitoramento-estoque-ue" },
  ]},
  { section: "Relatórios", items: [
    { id: "rel-compras", label: "Compras", screen: "ww:rel-compras" },
    { id: "rel-dist-ue", label: "Distribuição por UE", screen: "ww:rel-dist-ue" },
    { id: "rel-dist-rota", label: "Distribuição por Rota", screen: "ww:rel-dist-rota" },
    { id: "rel-entradas-saidas-ue", label: "Entradas e Saídas nas UE", screen: "ww:rel-entradas-saidas-ue" },
  ]},
  { section: "Administração", items: [
    { id: "gam-usuarios", label: "Usuários", screen: "ww:gam-usuarios" },
    { id: "gam-perfis", label: "Perfis", screen: "ww:gam-perfis" },
  ]},
];

const GAM_REP_ID = 2;

export function getMenuCatalog() {
  return MENU_CATALOG;
}

export async function getRoleMenuIds(roleId) {
  const [rows] = await pool.query(
    `SELECT menu_id FROM sga_role_menu WHERE RoleId = :roleId ORDER BY menu_id`,
    { roleId: Number(roleId) }
  );
  return rows.map((r) => r.menu_id);
}

export async function setRoleMenuIds(roleId, menuIds) {
  const id = Number(roleId);
  const ids = [...new Set((menuIds || []).map(String))];
  await pool.query(`DELETE FROM sga_role_menu WHERE RoleId = :roleId`, { roleId: id });
  if (ids.length) {
    const values = ids.map((menu_id) => [id, menu_id]);
    await pool.query(`INSERT INTO sga_role_menu (RoleId, menu_id) VALUES ?`, [values]);
  }
  return getRoleMenuIds(id);
}

export async function getUserRoleIds(userGuid) {
  try {
    const [rows] = await gamPool.query(
      `SELECT UserMemRoleRoleId AS RoleId FROM usermemrole
       WHERE UserGUID = :userGuid AND RepId = :repId`,
      { userGuid, repId: GAM_REP_ID }
    );
    return rows.map((r) => Number(r.RoleId));
  } catch (err) {
    console.warn("[menuPermissions] GAM indisponível (confira MYSQL_GAM_DATABASE):", err.message);
    return [];
  }
}

export async function setUserRoleIds(userGuid, roleIds, auditUser = "web") {
  await gamPool.query(
    `DELETE FROM usermemrole WHERE UserGUID = :userGuid AND RepId = :repId`,
    { userGuid, repId: GAM_REP_ID }
  );
  const ids = [...new Set((roleIds || []).map(Number).filter(Boolean))];
  for (const roleId of ids) {
    await gamPool.query(
      `INSERT INTO usermemrole (UserGUID, RepId, UserMemRoleRoleId, UserMemRoleCreDate, UserMemRoleCreUser, UserMemRoleUpdDate, UserMemRoleUpdUser)
       VALUES (:userGuid, :repId, :roleId, NOW(), :auditUser, NOW(), :auditUser)`,
      { userGuid, repId: GAM_REP_ID, roleId, auditUser }
    );
  }
  return getUserRoleIds(userGuid);
}

export async function getUserAllowedMenuIds(userGuid) {
  const roleIds = await getUserRoleIds(userGuid);
  if (!roleIds.length) return null;
  const [rows] = await pool.query(
    `SELECT DISTINCT menu_id FROM sga_role_menu WHERE RoleId IN (${roleIds.map(() => "?").join(",")})`,
    roleIds
  );
  const menuIds = rows.map((r) => r.menu_id);
  // Perfil sem menus configurados ainda → não restringe (compatível com instalações existentes)
  if (!menuIds.length) return null;
  return menuIds;
}
