import { ReturnChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { Benchmark, PanelTitle } from "../components/Ui";
import type { PageProps } from "./types";

export default function Compare({
  settings,
  filterBar,
  filtered,
  all,
  reference,
  benchmark,
}: PageProps) {
  return (
    <>
      <section className="panel table-panel">
        <PanelTitle
          title="Todas as alternativas"
          subtitle={`${settings.method === "historical" ? "CDI histórico acumulado" : "CDI atual constante (estimativa)"} · valores brutos · diferença em pontos percentuais`}
        />
        {filterBar}
        <ComparisonTable rows={filtered(all)} referenceId={reference.id} />
      </section>
      <div className="two-columns">
        <section className="panel">
          <PanelTitle
            title="Retorno por alternativa"
            subtitle="Comparação do desempenho disponível"
          />
          <ReturnChart rows={filtered(all)} referenceId={reference.id} />
        </section>
        <section className="panel">
          <PanelTitle
            title="Valor final hipotético"
            subtitle="O efeito dos retornos sobre o seu capital"
          />
          <ReturnChart
            rows={filtered(all)}
            metric="final"
            referenceId={reference.id}
          />
        </section>
      </div>
      <Benchmark row={benchmark} />
    </>
  );
}
