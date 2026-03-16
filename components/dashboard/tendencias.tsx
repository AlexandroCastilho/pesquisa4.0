"use client";

import { useState, useEffect, useCallback } from "react";

type Dia = { data: string; envios: number; respostas: number };
type Periodo = 7 | 30 | 90;

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: 7, label: "7 dias" },
  { valor: 30, label: "30 dias" },
  { valor: 90, label: "90 dias" },
];

export function DashboardTendencias() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [dados, setDados] = useState<Dia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (p: Periodo) => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/dashboard/tendencias?periodo=${p}`);
      if (!res.ok) throw new Error("Erro ao carregar dados.");
      const json = (await res.json()) as { dados: Dia[] };
      setDados(json.dados);
    } catch {
      setErro("Não foi possível carregar as tendências.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar(periodo);
  }, [periodo, carregar]);

  const totalEnvios = dados.reduce((s, d) => s + d.envios, 0);
  const totalRespostas = dados.reduce((s, d) => s + d.respostas, 0);

  return (
    <div className="app-card p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--card-foreground)]">Tendência de respostas</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Envios e respostas no período selecionado.</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODOS.map(({ valor, label }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setPeriodo(valor)}
              className={
                periodo === valor
                  ? "px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "px-3 py-1.5 rounded-md text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <span className="text-sm text-[var(--muted-foreground)]">Carregando…</span>
        </div>
      ) : erro ? (
        <div className="h-32 flex items-center justify-center">
          <span className="text-sm text-[var(--muted-foreground)]">{erro}</span>
        </div>
      ) : (
        <>
          <div className="flex gap-4 text-sm">
            <div className="surface-soft px-3 py-2">
              <span className="text-[var(--muted-foreground)]">Envios </span>
              <strong className="text-[var(--foreground)]">{totalEnvios}</strong>
            </div>
            <div className="surface-soft px-3 py-2">
              <span className="text-[var(--muted-foreground)]">Respostas </span>
              <strong className="text-[var(--primary)]">{totalRespostas}</strong>
            </div>
          </div>

          <BarraSVG dados={dados} periodo={periodo} />
        </>
      )}
    </div>
  );
}

function BarraSVG({ dados, periodo }: { dados: Dia[]; periodo: Periodo }) {
  if (dados.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
        Nenhum dado no período.
      </div>
    );
  }

  const maxVal = Math.max(...dados.map((d) => Math.max(d.envios, d.respostas)), 1);
  const barWidth = periodo <= 7 ? 24 : periodo <= 30 ? 10 : 5;
  const gap = periodo <= 7 ? 10 : periodo <= 30 ? 4 : 2;
  const totalWidth = dados.length * (barWidth * 2 + gap + 4);
  const height = 80;

  return (
    <div className="overflow-x-auto">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${totalWidth} ${height + 20}`}
        style={{ width: "100%", minWidth: `${Math.min(totalWidth, 320)}px`, height: "auto" }}
        aria-label="Gráfico de tendências"
      >
        {dados.map((d, i) => {
          const x = i * (barWidth * 2 + gap + 4);
          const hEnvios = (d.envios / maxVal) * height;
          const hRespostas = (d.respostas / maxVal) * height;

          // Exibir rótulo a cada N barras para não poluir
          const step = periodo <= 7 ? 1 : periodo <= 30 ? 5 : 15;
          const mostrarLabel = i % step === 0;
          const labelData = d.data.slice(5); // "MM-DD"

          return (
            <g key={d.data}>
              {/* Barra envios */}
              <rect
                x={x}
                y={height - hEnvios}
                width={barWidth}
                height={hEnvios}
                rx={2}
                fill="var(--muted)"
              />
              {/* Barra respostas */}
              <rect
                x={x + barWidth + 2}
                y={height - hRespostas}
                width={barWidth}
                height={hRespostas}
                rx={2}
                fill="var(--primary)"
                fillOpacity={0.85}
              />
              {mostrarLabel && (
                <text
                  x={x + barWidth}
                  y={height + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--muted-foreground)"
                >
                  {labelData}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 mt-1 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-[var(--muted)]" /> Envios
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-[var(--primary)] opacity-85" /> Respostas
        </span>
      </div>
    </div>
  );
}
