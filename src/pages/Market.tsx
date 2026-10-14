import { ReturnChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { Benchmark, PanelTitle } from "../components/Ui";
import type { PageProps } from "./types";

export default function Market({
  validMarket,
  filterBar,
  filtered,
  market,
  reference,
  benchmark,
  onShorterPeriod,
}: PageProps) {
  return (
    <>
      <section className="panel table-panel">
        <PanelTitle
          title="Mercado brasileiro"
          subtitle={`${validMarket.length} de 8 ativos com histórico comparável · dados consultados automaticamente`}
        />
        {filterBar}
        <ComparisonTable onShorterPeriod={onShorterPeriod}
          rows={filtered(market.filter((r) => r.category !== "Índice"))}
          referenceId={reference.id}
          prices
        />
      </section>
      <section className="panel">
        <PanelTitle
          title="Desempenho por ativo"
          subtitle="Retornos no intervalo efetivo, com referência em renda fixa"
        />
        <ReturnChart
          rows={[...filtered(validMarket), reference]}
          referenceId={reference.id}
        />
      </section>
      <Benchmark row={benchmark} />
    </>
  );
}

