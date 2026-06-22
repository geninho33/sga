export const MODULES = [
  { id: "dashboard", icon: "fa-grip", label: "Dashboard", group: "principal" },
  { id: "cadastros", icon: "fa-database", label: "Cadastros", group: "operacao" },
  { id: "cardapio", icon: "fa-utensils", label: "Cardápio", group: "operacao", badge: "3.279" },
  { id: "estoque", icon: "fa-boxes-stacked", label: "Estoque", group: "operacao" },
  { id: "distribuicao", icon: "fa-truck", label: "Distribuição", group: "operacao", badge: "2.124" },
  { id: "atendimento", icon: "fa-users", label: "Atendimento", group: "operacao" },
  { id: "nutricao", icon: "fa-heart-pulse", label: "Nutrição", group: "dados" },
  { id: "auditoria", icon: "fa-shield-halved", label: "Auditoria", group: "dados" },
  { id: "config", icon: "fa-sliders", label: "Configuração", group: "config" },
  { id: "acesso", icon: "fa-key", label: "Controle de Acesso", group: "config" },
];

export const RAIL_GROUPS = ["principal", "operacao", "dados", "config"];

export const SIDEBAR = {
  dashboard: null,
  cadastros: {
    title: "Cadastros",
    sub: "Prefeitura · tabelas base do sistema",
    groups: [
      {
        label: "Tabelas",
        items: [
          { id: "cad-produtos", icon: "fa-carrot", label: "Produtos / Alimentos", screen: "produtos", count: "4.793" },
          {
            id: "cad-locais",
            icon: "fa-school",
            label: "Unidades / Locais",
            screen: "formulario",
            tree: [{ label: "Unidades escolares" }, { label: "Locais de estoque" }],
          },
          {
            id: "cad-fornecedores",
            icon: "fa-truck",
            label: "Fornecedores",
            tree: [{ label: "Lista de fornecedores" }, { label: "Contratos" }],
          },
        ],
      },
      {
        label: "Referência",
        items: [
          { id: "cad-unidades", icon: "fa-sliders", label: "Unidades de medida" },
          { id: "cad-grupos", icon: "fa-database", label: "Grupos de produtos" },
        ],
      },
    ],
  },
  cardapio: {
    title: "Cardápio",
    sub: "Planejamento nutricional e ocorrências",
    groups: [
      {
        label: "Operação",
        items: [
          { id: "car-lista", icon: "fa-utensils", label: "Cardápios" },
          { id: "car-pratos", icon: "fa-utensils", label: "Pratos e receitas" },
          { id: "car-ocorrencias", icon: "fa-list-ul", label: "Ocorrências", count: "389k" },
        ],
      },
    ],
  },
  estoque: {
    title: "Estoque",
    sub: "Movimentações, notas e ajustes",
    groups: [
      {
        label: "Operação",
        items: [
          { id: "est-saldo", icon: "fa-boxes-stacked", label: "Saldo e movimentações", count: "189k" },
          { id: "est-notas", icon: "fa-file-text", label: "Notas fiscais" },
        ],
      },
    ],
  },
  distribuicao: {
    title: "Distribuição",
    sub: "Remessas, rotas e logística",
    groups: [
      {
        label: "Operação",
        items: [
          { id: "dist-remessas", icon: "fa-box-open", label: "Remessas", count: "2.124" },
          { id: "dist-distrib", icon: "fa-truck", label: "Distribuições", count: "39k" },
        ],
      },
    ],
  },
  atendimento: {
    title: "Atendimento",
    sub: "Alunos, medidas e mapa UE",
    groups: [
      {
        label: "Operação",
        items: [
          { id: "aten-lista", icon: "fa-utensils", label: "Atendimentos" },
          { id: "aten-alunos", icon: "fa-user-graduate", label: "Alunos" },
        ],
      },
    ],
  },
  nutricao: {
    title: "Nutrição",
    sub: "Diagnóstico nutricional e índices",
    groups: [
      {
        label: "Análise",
        items: [
          { id: "nut-diag", icon: "fa-chart-pie", label: "Diagnóstico nutricional" },
        ],
      },
    ],
  },
  auditoria: {
    title: "Auditoria",
    sub: "Logs de acesso e operações",
    groups: [
      {
        label: "Consultas",
        items: [
          { id: "aud-acesso", icon: "fa-right-to-bracket", label: "Log de acessos", count: "38k" },
        ],
      },
    ],
  },
  config: {
    title: "Configuração",
    sub: "Parâmetros da prefeitura",
    groups: [
      {
        label: "Sistema",
        items: [
          { id: "cfg-param", icon: "fa-sliders", label: "Parâmetros gerais" },
          { id: "cfg-pref", icon: "fa-landmark", label: "Prefeitura" },
        ],
      },
    ],
  },
  acesso: {
    title: "Controle de Acesso",
    sub: "Usuários e permissões",
    groups: [
      {
        label: "Segurança",
        items: [
          { id: "acc-usuarios", icon: "fa-users", label: "Usuários", count: "41" },
        ],
      },
    ],
  },
};

export const COMMANDS = [
  { icon: "fa-grip", label: "Dashboard Geral", path: "Início", screen: "dashboard" },
  { icon: "fa-carrot", label: "Produtos / Alimentos", path: "Cadastros", screen: "produtos" },
  { icon: "fa-school", label: "Unidades / Locais", path: "Cadastros › Locais", screen: "formulario" },
  { icon: "fa-utensils", label: "Cardápios do mês", path: "Cardápio" },
  { icon: "fa-boxes-stacked", label: "Saldo de estoque", path: "Estoque" },
  { icon: "fa-truck", label: "Remessas ativas", path: "Distribuição" },
  { icon: "fa-key", label: "Usuários do sistema", path: "Controle de Acesso" },
];

export const STATS = [
  { label: "Remessas ativas", value: "2.124", trend: "operacional", up: true, icon: "fa-box-open", tone: "brand" },
  { label: "Locais ativos", value: "1.252", trend: "UEs cadastradas", up: true, icon: "fa-school", tone: "info" },
  { label: "Produtos ativos", value: "3.566", trend: "de 4.793", up: true, icon: "fa-carrot", tone: "success" },
  { label: "Cardápios", value: "3.279", trend: "planejados", up: true, icon: "fa-utensils", tone: "warning" },
];

export const MODULE_DESC = {
  cadastros: "Produtos, locais, fornecedores e tabelas de referência.",
  cardapio: "Planejamento de cardápios, pratos e ocorrências diárias.",
  estoque: "Saldo, notas fiscais, ajustes e romaneios de entrada.",
  distribuicao: "Remessas, distribuições, rancho e rotas de entrega.",
  atendimento: "Atendimentos por UE, alunos e medidas antropométricas.",
  nutricao: "Diagnóstico nutricional, TACO e índices de composição.",
  auditoria: "Logs de acesso e rastreabilidade de operações.",
  config: "Parâmetros e configurações da prefeitura.",
  acesso: "Usuários, perfis e permissões do sistema.",
};

export const PRODUTO_STATUS = {
  A: { label: "Ativo", cls: "badge-success" },
  I: { label: "Inativo", cls: "badge-neutral" },
};
