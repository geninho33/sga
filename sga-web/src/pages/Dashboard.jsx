import { useEffect, useMemo, useState } from "react";
import { fetchDashboardStats } from "../api/dashboard";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_STAT_META, MENU_SECTIONS } from "../data/navigation";

const toneMap = {
  brand: { bg: "var(--brand-soft)", fg: "var(--brand-text)" },
  info: { bg: "var(--info-bg)", fg: "var(--info-fg)" },
  warning: { bg: "var(--warning-bg)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-bg)", fg: "var(--success-fg)" },
};

function greetingName(usuNome, usuUsuario) {
  const full = String(usuNome || usuUsuario || "").trim();
  if (!full) return "usuário";
  return full.split(/\s+/)[0];
}

function formatStatValue(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("pt-BR");
}

function buildStatTrend(meta, stats) {
  if (meta.trendKey && stats) {
    const total = stats[meta.trendKey];
    return `${meta.trendPrefix || ""}${formatStatValue(total)}`;
  }
  return meta.trend;
}

export default function Dashboard({ onScreen }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsMeta, setStatsMeta] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      try {
        const res = await fetchDashboardStats();
        if (!cancelled) {
          setStats(res.data);
          setStatsMeta(res.meta);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setStatsMeta(null);
        }
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.prefCodigo]);

  const municipalityLabel = useMemo(() => {
    const m = statsMeta?.prefMunicipio || user?.prefMunicipio;
    const p = statsMeta?.prefNome || user?.prefNome;
    if (m && p && m !== p) return `${p} — ${m}`;
    return m || p || "prefeitura ativa";
  }, [statsMeta, user]);

  const statCards = DASHBOARD_STAT_META.map((meta) => ({
    ...meta,
    value: loadingStats ? "…" : formatStatValue(stats?.[meta.key]),
    trend: loadingStats ? "carregando" : buildStatTrend(meta, stats),
    up: true,
  }));

  return (
    <div className="content-inner">
      <Breadcrumb items={["Início", "Dashboard"]} />
      <div className="page-head">
        <div>
          <div className="page-title">Bom dia, {greetingName(user?.usuNome, user?.usuUsuario)}</div>
          <div className="page-desc">
            Visão geral da alimentação escolar municipal — {municipalityLabel}.
          </div>
        </div>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-7)",
        }}
      >
        {statCards.map((s) => {
          const t = toneMap[s.tone];
          return (
            <div className="stat" key={s.key}>
              <div className="stat-top">
                <span className="stat-icon" style={{ background: t.bg, color: t.fg }}>
                  <FaIcon icon={s.icon} />
                </span>
                <span className={"stat-trend " + (s.up ? "trend-up" : "trend-down")}>
                  <FaIcon icon="fa-arrow-trend-up" /> {s.trend}
                </span>
              </div>
              <div className="stat-value tnum">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="section-label">
        <span>Menu do sistema</span>
        <span className="badge badge-neutral pill" style={{ fontWeight: 600 }}>
          {MENU_SECTIONS.length} seções
        </span>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {MENU_SECTIONS.map((section) => (
          <button
            type="button"
            className="module-card"
            key={section.id}
            onClick={() => section.items[0]?.screen && onScreen(section.items[0].screen)}
          >
            <span className="arrow">
              <FaIcon icon="fa-arrow-right" />
            </span>
            <span className="module-icon">
              <FaIcon icon={section.icon} />
            </span>
            <h4>{section.label}</h4>
            <p>{section.items.length} funções cadastradas no menu.</p>
          </button>
        ))}
      </div>
    </div>
  );
}
