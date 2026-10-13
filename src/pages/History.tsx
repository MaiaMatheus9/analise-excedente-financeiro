import { Check } from "lucide-react";
import { HistoryChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { PanelTitle } from "../components/Ui";
import { dateLabel } from "../lib/finance";
import type { PageProps } from "./types";

export default function History({
  market,
  selected,
  setSelected,
  analysis,
  reference,
}: PageProps) {
  return (
    <>
      <section className="panel">
        <PanelTitle
          title="Uma trajetória, além do resultado final"
          subtitle="Retorno acumulado desde a primeira cotação · selecione até quatro ativos"
        />
        <div className="asset-picker">
          {market.map((r) => (
            <button
              key={r.id}
              aria-pressed={selected.includes(r.id)}
              disabled={
                r.rate === null ||
                (!selected.includes(r.id) && selected.length >= 4)
              }
              className={selected.includes(r.id) ? "selected" : ""}
              onClick={() =>
                setSelected((s) =>
                  s.includes(r.id)
                    ? s.filter((id) => id !== r.id)
                    : [...s, r.id],
                )
              }
            >
              {selected.includes(r.id) && <Check size={14} />} {r.name}
              {r.rate === null ? " · indisponível" : ""}
            </button>
          ))}
        </div>
        <HistoryChart rows={market.filter((r) => selected.includes(r.id))} />
        <p className="chart-footnote">
          Intervalo efetivo: {dateLabel(analysis.start)} a{" "}
          {dateLabel(analysis.end)}. Fins de semana, feriados e dias sem cotação
          não geram pontos. Não há interpolação de valores ausentes.
        </p>
      </section>
      <section className="panel table-panel">
        <PanelTitle
          title="Detalhes das séries selecionadas"
          subtitle="Ajustes e datas informados para cada ativo"
        />
        <ComparisonTable
          rows={market.filter((r) => selected.includes(r.id))}
          referenceId={reference.id}
          prices
        />
      </section>
    </>
  );
}
