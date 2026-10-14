import { Landmark } from "lucide-react";
import { ReturnChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { SettingsForm } from "../components/SettingsForm";
import { Kpi, PanelTitle } from "../components/Ui";
import { money, percent } from "../lib/finance";
import { useCapitalAnalisado } from "../contexts/CapitalContext";
import type { PageProps } from "./types";

export default function Fixed({
  settings,
  setSettings,
  fixed,
  analysis,
  reference,
}: PageProps) {
  const { capitalAnalisado } = useCapitalAnalisado();

  return (
    <>
      <section className="panel">
        <PanelTitle
          title="Monte suas alternativas de renda fixa"
          subtitle="Ajuste as taxas e veja os resultados mudarem automaticamente"
        />
        <SettingsForm value={settings} onChange={setSettings} />
      </section>
      <div className="kpi-grid fixed-kpis">
        {fixed.map((r) => (
          <Kpi
            key={r.id}
            icon={Landmark}
            label={r.name.toUpperCase()}
            value={r.final === null ? "—" : money(r.final)}
            detail={
              r.rate === null
                ? "CDI indisponível"
                : `Ganho bruto: ${money(r.final! - capitalAnalisado)} · ${percent(r.rate)}`
            }
            blue={r.id === reference.id}
          />
        ))}
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelTitle
            title="Quanto cada oferta rendeu"
            subtitle={
              settings.method === "historical"
                ? `${analysis.observations} observações diárias do CDI no intervalo`
                : "Simulação com a taxa anual atual constante"
            }
          />
          <ReturnChart rows={fixed} referenceId={reference.id} />
        </section>
        <section className="panel">
          <PanelTitle
            title="Capital ao final"
            subtitle="Antes de IR, IOF e outras despesas"
          />
          <ReturnChart rows={fixed} metric="final" referenceId={reference.id} />
        </section>
      </div>
      <section className="panel table-panel">
        <ComparisonTable rows={fixed} referenceId={reference.id} />
      </section>
    </>
  );
}
