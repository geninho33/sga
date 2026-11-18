/** Menu principal do SGA — espelha a estrutura do sistema legado. */
import { getWwModuleById, parseWwFormScreen } from "./wwModules";

export const MENU_SECTIONS = [
  {
    id: "cadastro",
    label: "Cadastro",
    icon: "fa-database",
    items: [
      { id: "alimentos", label: "Alimentos", screen: "produtos", icon: "fa-carrot" },
      { id: "unidades", label: "Unidade", screen: "ww:unidades", icon: "fa-ruler" },
      { id: "conversao-unidades", label: "Conversão de Unidades", screen: "ww:conv-qtdes", icon: "fa-right-left" },
      { id: "locais", label: "Locais", screen: "ww:locais", icon: "fa-school" },
      { id: "fornecedor", label: "Fornecedor", screen: "ww:fornecedores", icon: "fa-truck-field" },
      { id: "rotas", label: "Rotas", screen: "ww:rotas", icon: "fa-route" },
      { id: "doencas", label: "Doenças", screen: "ww:doencas", icon: "fa-heart-pulse" },
      { id: "tipo-ajuste", label: "Tipo de Ajustes", screen: "ww:tipos-ajuste", icon: "fa-sliders" },
    ],
  },
  {
    id: "preparacoes",
    label: "Preparações",
    icon: "fa-utensils",
    items: [
      { id: "refeicoes", label: "Refeições", screen: "ww:pratos", icon: "fa-bowl-food" },
      { id: "tipo-refeicao", label: "Tipo de Refeição", screen: "ww:tipos-refeicao", icon: "fa-clock" },
      { id: "cardapios", label: "Cardápios", screen: "ww:cardapios", icon: "fa-utensils" },
      { id: "grupo-cardapios", label: "Grupo de Cardápios", screen: "ww:cardapio-grupos", icon: "fa-layer-group" },
      { id: "atendimento", label: "Atendimento", screen: "ww:atendimentos", icon: "fa-users-between-lines" },
      { id: "calendario-letivo", label: "Calendário Letivo", screen: "ww:calendario-letivo", icon: "fa-calendar-days" },
      { id: "acompanhamento-ue", label: "Acompanhamento da Unidade Escolar", screen: "ww:mapa-estoque", icon: "fa-map" },
      { id: "lancar-qtd-fixa", label: "Lançar Quantidade Fixa", screen: "ww:qtde-fixa", icon: "fa-hashtag" },
    ],
  },
  {
    id: "logistica",
    label: "Logística",
    icon: "fa-truck",
    items: [
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
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    icon: "fa-boxes-stacked",
    items: [
      { id: "ajuste", label: "Ajuste", screen: "ww:ajuste" },
      { id: "inventario", label: "Inventário", screen: "ww:inventario" },
      { id: "posicao", label: "Posição", screen: "ww:posicao" },
      { id: "saldo", label: "Saldo", screen: "ww:saldo" },
      { id: "movimentacao", label: "Movimentação", screen: "ww:movimentacao" },
      { id: "apuracao-entrada-saida", label: "Apuração de Entrada e Saída", screen: "ww:apuracao-entrada-saida" },
      { id: "monitoramento-estoque-ue", label: "Monitoramento de Estoque das UE", screen: "ww:monitoramento-estoque-ue" },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: "fa-file-text",
    items: [
      { id: "rel-compras", label: "Compras", screen: "ww:rel-compras" },
      { id: "rel-dist-ue", label: "Distribuição de Produtos por UE", screen: "ww:rel-dist-ue" },
      { id: "rel-dist-rota", label: "Distribuição de Produtos por Rota", screen: "ww:rel-dist-rota" },
      { id: "rel-entradas-saidas-ue", label: "Entradas e Saídas nas Unidades Educativas", screen: "ww:rel-entradas-saidas-ue" },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    icon: "fa-user-gear",
    items: [
      { id: "prefeituras", label: "Prefeitura", screen: "ww:prefeituras", icon: "fa-landmark" },
      { id: "gam-usuarios", label: "Usuários", screen: "ww:gam-usuarios", icon: "fa-users" },
      { id: "gam-perfis", label: "Perfis", screen: "ww:gam-perfis", icon: "fa-user-shield" },
    ],
  },
];

export function findNavItem(screen) {
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (item.screen === screen) {
        return { ...item, section: section.label, sectionId: section.id };
      }
    }
  }
  if (screen === "dashboard") {
    return { id: "dashboard", label: "Dashboard", section: "Início", screen: "dashboard" };
  }
  if (screen === "produtos" || screen?.startsWith("produto:")) {
    return { id: "alimentos", label: "Alimentos", section: "Cadastro", screen: "produtos" };
  }
  if (screen?.startsWith("ww-form:")) {
    const parsed = parseWwFormScreen(screen);
    if (parsed) {
      const mod = getWwModuleById(parsed.moduleId);
      return {
        id: parsed.moduleId,
        label: mod?.title || parsed.moduleId,
        section: mod?.breadcrumbSection || "Cadastro",
        screen: mod?.listScreen || `ww:${parsed.moduleId}`,
      };
    }
  }
  if (screen?.startsWith("ww:")) {
    const id = screen.slice(3);
    for (const section of MENU_SECTIONS) {
      const item = section.items.find((i) => i.screen === screen);
      if (item) return { ...item, section: section.label, sectionId: section.id };
    }
    const mod = getWwModuleById(id);
    return { id, label: mod?.title || id, section: mod?.breadcrumbSection || "Cadastro", screen };
  }
  return null;
}

export function flattenCommands(allowedMenuIds = null) {
  const sections = filterMenuSections(MENU_SECTIONS, allowedMenuIds);
  const cmds = [{ icon: "fa-grip", label: "Dashboard", path: "Início", screen: "dashboard" }];
  for (const section of sections) {
    for (const item of section.items) {
      cmds.push({
        icon: item.icon || section.icon || "fa-angle-right",
        label: item.label,
        path: section.label,
        screen: item.screen,
      });
    }
  }
  return cmds;
}

/** Metadados visuais dos KPIs do dashboard (valores vêm da API por município). */
export const DASHBOARD_STAT_META = [
  { key: "remessasAtivas", label: "Remessas ativas", trend: "operacional", icon: "fa-box-open", tone: "brand" },
  { key: "locaisAtivos", label: "Locais ativos", trend: "UEs cadastradas", icon: "fa-school", tone: "info" },
  { key: "produtosAtivos", label: "Produtos ativos", icon: "fa-carrot", tone: "success" },
  { key: "cardapios", label: "Cardápios", trend: "planejados", icon: "fa-utensils", tone: "warning" },
];

/** Filtra seções do menu conforme permissões do perfil (null ou [] = sem restrição). */
export function filterMenuSections(sections, allowedMenuIds) {
  if (allowedMenuIds == null || allowedMenuIds.length === 0) return sections;
  const allowed = new Set(allowedMenuIds);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.has(item.id)),
    }))
    .filter((section) => section.items.length > 0);
}
