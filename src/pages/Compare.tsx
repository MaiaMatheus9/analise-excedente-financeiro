import { useState } from "react";
import { ReturnChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { Benchmark, PanelTitle } from "../components/Ui";
import type { PageProps } from "./types";

export default function Compare({
  filterBar, filtered, market, reference, benchmark, onShorterPeriod,
}: PageProps) {
  const [metric, setMetric] = useState<"rate" | "final">("rate");
  const rows = [reference, ...filtered(market.filter((r) => r.category !== "Índice"))];
  return <>
    <section className="panel table-panel">
      <PanelTitle title="Mercado × sua referência"
        subtitle="Valores brutos, antes de impostos e taxas. Diferença em pontos percentuais." />
      {filterBar}
      <ComparisonTable rows={rows} referenceId={reference.id}
        onShorterPeriod={onShorterPeriod} compact />
    </section>
    <section className="panel">
      <PanelTitle title="Comparação visual" subtitle={`Referência: ${reference.name}`} />
      <div className="segmented" aria-label="Métrica do gráfico">
        <button aria-pressed={metric === "rate"} className={metric === "rate" ? "active" : ""} onClick={() => setMetric("rate")}>Retorno (%)</button>
        <button aria-pressed={metric === "final"} className={metric === "final" ? "active" : ""} onClick={() => setMetric("final")}>Valor final (R$)</button>
      </div>
      <ReturnChart rows={rows} metric={metric} referenceId={reference.id} />
    </section>
    <section className="panel">
      <details>
        <summary className="comparison-details-title">Ver detalhes da comparação</summary>
        <p className="muted">LCI e LCA são cenários de percentual do CDI. A comparação não desconta tributos ou custos, nem modela carência e vencimento. Tesouro Selic é uma estimativa pelo indexador; poupança considera aniversários completos.</p>
        {rows.filter((r) => r.rate !== null).map((r) => <p key={r.id} className="muted"><strong>{r.name}</strong>: {r.basis || "Conforme os dados disponíveis da fonte."} Período: {r.start.split("-").reverse().join("/")} a {r.end.split("-").reverse().join("/")}.</p>)}
        <p className="muted">Fontes: Banco Central (CDI, Selic e poupança) e brapi (renda variável).</p>
        <Benchmark row={benchmark} />
      </details>
    </section>
  </>;
}
