import { useEffect, useState } from "react";
import AppMenu from "./components/shell/AppMenu";
import AppFooter from "./components/shell/AppFooter";
import CommandPalette from "./components/shell/CommandPalette";
import Topbar from "./components/shell/Topbar";
import { useAuth } from "./context/AuthContext";
import { findNavItem } from "./data/navigation";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import Placeholder from "./pages/Placeholder";
import ProdutoFormPage from "./pages/ProdutoFormPage";
import ProdutosPage from "./pages/ProdutosPage";
import CronogramaLocalPage from "./pages/CronogramaLocalPage";
import CalendarioLetivoPage from "./pages/CalendarioLetivoPage";
import CardapioFormPage from "./pages/CardapioFormPage";
import CardapioGrupoFormPage from "./pages/CardapioGrupoFormPage";
import GamUserFormPage from "./pages/GamUserFormPage";
import GamRoleFormPage from "./pages/GamRoleFormPage";
import RanchoWizardPage from "./pages/RanchoWizardPage";
import RanchoFixoWizardPage from "./pages/RanchoFixoWizardPage";
import AjustePerCaptasPage from "./pages/AjustePerCaptasPage";
import LancarQtdeFixaPage from "./pages/LancarQtdeFixaPage";
import LogisticaToolPage from "./pages/LogisticaToolPage";
import MapaEstoquePage from "./pages/MapaEstoquePage";
import EstoqueMovimentacaoPage from "./pages/EstoqueMovimentacaoPage";
import EstoqueInventarioPage from "./pages/EstoqueInventarioPage";
import EstoqueApuracaoPage from "./pages/EstoqueApuracaoPage";
import EstoqueMonitoramentoPage from "./pages/EstoqueMonitoramentoPage";
import RelatorioPage from "./pages/RelatorioPage";
import WwFormPage from "./pages/WwFormPage";
import WwListPage from "./pages/WwListPage";
import WwTransactionFormPage from "./pages/WwTransactionFormPage";
import { buildCreatedRecordId, getWwFormConfig } from "./data/wwForms";
import {
  getWwModuleById,
  getWwModuleByScreen,
  parseWwFormScreen,
  parseWwListParams,
  wwFormScreen,
} from "./data/wwModules";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function parseProdutoScreen(screen) {
  if (!screen?.startsWith("produto:")) return null;
  const id = screen.slice("produto:".length);
  if (id === "novo") return { isNew: true };
  const codigo = Number(id);
  return Number.isFinite(codigo) ? { isNew: false, prodCodigo: codigo } : null;
}

function parseCronogramaLocalScreen(screen) {
  if (!screen?.startsWith("cronograma-local:")) return null;
  const id = screen.slice("cronograma-local:".length);
  const croCodigo = Number(id);
  return Number.isFinite(croCodigo) ? { croCodigo } : null;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [theme, setTheme] = useState("light");
  const [screen, setScreen] = useState("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigateScreen = (s) => setScreen(s);

  const openProduto = (prodCodigo) => {
    if (prodCodigo === "novo") navigateScreen("produto:novo");
    else navigateScreen(`produto:${prodCodigo}`);
  };

  const openWwRecord = (moduleId, recordId, options) => {
    navigateScreen(wwFormScreen(moduleId, recordId, options?.tab));
  };

  const renderScreen = () => {
    const produtoRoute = parseProdutoScreen(screen);
    if (produtoRoute) {
      return (
        <ProdutoFormPage
          isNew={produtoRoute.isNew}
          prodCodigo={produtoRoute.prodCodigo}
          onBack={() => navigateScreen("produtos")}
          onCreated={(data) => navigateScreen(`produto:${data.prodCodigo}`)}
        />
      );
    }
    const cronogramaLocalRoute = parseCronogramaLocalScreen(screen);
    if (cronogramaLocalRoute) {
      return (
        <CronogramaLocalPage
          croCodigo={cronogramaLocalRoute.croCodigo}
          onBack={() => navigateScreen("ww:cronograma")}
        />
      );
    }
    const wwFormRoute = parseWwFormScreen(screen);
    if (wwFormRoute) {
      const mod = getWwModuleById(wwFormRoute.moduleId);
      const formConfig = getWwFormConfig(wwFormRoute.moduleId);
      const back = () => navigateScreen(mod?.listScreen || `ww:${wwFormRoute.moduleId}`);
      if (wwFormRoute.moduleId === "cardapio-grupos") {
        return (
          <CardapioGrupoFormPage
            recordId={wwFormRoute.recordId}
            isNew={wwFormRoute.isNew}
            onBack={back}
            onCreated={(row, cfg) => navigateScreen(`ww-form:cardapio-grupos:${row.carGruCodigo}`)}
          />
        );
      }
      if (wwFormRoute.moduleId === "cardapios") {
        return (
          <CardapioFormPage
            recordId={wwFormRoute.recordId}
            isNew={wwFormRoute.isNew}
            initialTab={wwFormRoute.initialTab}
            onBack={back}
            onNavigate={navigateScreen}
            onCreated={(row, cfg) => navigateScreen(`ww-form:cardapios:${row.carDapCodigo}`)}
          />
        );
      }
      if (wwFormRoute.moduleId === "gam-usuarios") {
        return (
          <GamUserFormPage
            recordId={wwFormRoute.recordId}
            isNew={wwFormRoute.isNew}
            onBack={back}
            onCreated={(row) => navigateScreen(`ww-form:gam-usuarios:${row.UserGUID}`)}
          />
        );
      }
      if (wwFormRoute.moduleId === "gam-perfis") {
        return (
          <GamRoleFormPage
            recordId={wwFormRoute.recordId}
            isNew={wwFormRoute.isNew}
            onBack={back}
            onCreated={(row) => navigateScreen(`ww-form:gam-perfis:${row.RoleId}`)}
          />
        );
      }
      if (formConfig) {
        return (
          <WwTransactionFormPage
            moduleId={wwFormRoute.moduleId}
            recordId={wwFormRoute.recordId}
            isNew={wwFormRoute.isNew}
            initialTab={wwFormRoute.initialTab}
            onBack={back}
            onCreated={(row, cfg) => {
              navigateScreen(`ww-form:${wwFormRoute.moduleId}:${buildCreatedRecordId(wwFormRoute.moduleId, row, cfg)}`);
            }}
          />
        );
      }
      return (
        <WwFormPage
          moduleId={wwFormRoute.moduleId}
          recordId={wwFormRoute.recordId}
          isNew={wwFormRoute.isNew}
          onBack={back}
        />
      );
    }
    if (screen === "dashboard") {
      return <Dashboard onScreen={navigateScreen} />;
    }
    if (screen === "produtos") {
      return <ProdutosPage onOpenProduto={openProduto} />;
    }
    const wwModule = getWwModuleByScreen(screen);
    if (wwModule) {
      if (wwModule.pageType === "custom") {
        if (wwModule.customPage === "calendario-letivo") {
          return <CalendarioLetivoPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "mapa-estoque") {
          return <MapaEstoquePage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "movimentacao") {
          return <EstoqueMovimentacaoPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "inventario") {
          return <EstoqueInventarioPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "apuracao") {
          return <EstoqueApuracaoPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "monitoramento-ue") {
          return <EstoqueMonitoramentoPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "relatorio") {
          return <RelatorioPage configId={wwModule.relatorioId} onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "qtde-fixa") {
          return <LancarQtdeFixaPage onBack={() => navigateScreen("dashboard")} />;
        }
        const logisticaTools = new Set([
          "remessa",
          "cancelamento-remessa",
          "largada",
        ]);
        if (wwModule.customPage === "rancho-assistente") {
          return <RanchoWizardPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "rancho-fixo") {
          return <RanchoFixoWizardPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (wwModule.customPage === "rancho-percapta") {
          return <AjustePerCaptasPage onBack={() => navigateScreen("dashboard")} />;
        }
        if (logisticaTools.has(wwModule.customPage)) {
          return (
            <LogisticaToolPage
              toolId={wwModule.customPage}
              onBack={() => navigateScreen("dashboard")}
            />
          );
        }
      }
      return (
        <WwListPage
          module={wwModule}
          onOpenRecord={openWwRecord}
          initialListParams={parseWwListParams(screen)}
          onNavigate={navigateScreen}
        />
      );
    }
    if (screen?.startsWith("placeholder:")) {
      const nav = findNavItem(screen);
      return (
        <Placeholder
          title={nav?.label || screen.replace("placeholder:", "")}
          section={nav?.section}
        />
      );
    }
    return <Dashboard onScreen={navigateScreen} />;
  };

  if (loading) {
    return (
      <div className="login-shell login-shell--with-footer">
        <div className="login-shell-main">
          <div className="login-card card login-loading">Carregando…</div>
        </div>
        <AppFooter className="app-footer--login" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app app--menu" data-sidebar={collapsed ? "collapsed" : "expanded"}>
      <Topbar
        onOpenCmd={() => setCmdOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        hasSidebar
      />
      <AppMenu activeScreen={screen} onScreen={navigateScreen} collapsed={collapsed} />
      <main className="content">{renderScreen()}</main>
      <AppFooter />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigateScreen} />
    </div>
  );
}
