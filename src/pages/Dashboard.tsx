import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Landmark,
  Wallet,
} from "lucide-react";
import { ReturnChart } from "../components/Charts";
import { ComparisonTable } from "../components/ComparisonTable";
import { Benchmark, Kpi, PanelTitle } from "../components/Ui";
import { dateLabel, money, percent } from "../lib/finance";
import { useCapitalAnalisado } from "../contexts/CapitalContext";
import type { PageProps } from "./types";

export default function Dashboard({
  settings,
  analysis,
  reference,
  data,
  best,
  validMarket,
  topCount,
  worst,
  filtered,
  navigate,
  benchmark,
}: PageProps) {
  const { capitalAnalisado } = useCapitalAnalisado();

  return (
    <>
      <div className="kpi-grid">
        <Kpi
          icon={Wallet}
          label="CAPITAL ANALISADO"
          value={money(capitalAnalisado)}
          detail="Mesmo valor em todas as alternativas"
        />
        <Kpi
          icon={CalendarDays}
          label="INTERVALO EFETIVO"
          value={`${analysis.days} dias úteis`}
          detail={`${dateLabel(analysis.start)} a ${dateLabel(analysis.end)}`}
        />
        <Kpi
          icon={Activity}
          label="CDI ANUAL ATUAL"
          value={data?.cdi.annual != null ? percent(data.cdi.annual) : "—"}
          detail={
            data?.cdi.date
              ? `BCB · referência ${dateLabel(data.cdi.date)}`
              : "Aguardando Banco Central"
          }
        />
        <Kpi
          icon={Landmark}
          label="RENDA FIXA DE REFERÊNCIA"
          value={reference.rate === null ? "—" : percent(reference.rate)}
          detail={reference.name}
          blue
        />
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">DESTAQUES DO PERÍODO</span>
          <h2>Os maiores retornos, lado a lado</h2>
        </div>
        <button className="text-button" onClick={() => navigate("compare")}>
          Ver comparação completa <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelTitle
            title={`Top ${best.length || 4} da B3 × referência`}
            subtitle="Retorno acumulado no intervalo"
          />
          <ReturnChart rows={[...best, reference]} referenceId={reference.id} />
          <div className="chart-legend">
            <span>
              <i /> Renda variável
            </span>
            <span>
              <i className="blue" /> Renda fixa de referência
            </span>
          </div>
        </section>
        <section className="panel">
          <PanelTitle
            title="Seu capital no fim do período"
            subtitle="Valor final hipotético · antes de impostos e custos"
          />
          <ReturnChart
            rows={[...best, reference]}
            metric="final"
            referenceId={reference.id}
          />
          <div className="chart-legend">
            <span>Capital inicial: {money(capitalAnalisado)}</span>
          </div>
        </section>
      </div>
      <div className="insight">
        <span className="insight-icon">
          <Activity size={21} />
        </span>
        <div>
          <strong>
            {best.length && reference.rate !== null
              ? `${topCount} de ${best.length} ativos do ranking superaram a renda fixa de referência.`
              : "O que os dados dizem sobre este período?"}
          </strong>
          <p>
            {best.length
              ? `${best[0].name} teve o maior retorno disponível: ${percent(best[0].rate!)}. ${validMarket.length} de 8 ativos com dados comparáveis.`
              : "O resumo será calculado automaticamente assim que as fontes retornarem dados comparáveis."}{" "}
            Desempenho passado não garante retorno futuro.
          </p>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUTRO LADO DA COMPARAÇÃO</span>
          <h2>Os menores retornos também importam</h2>
        </div>
        <span className="subtle-badge">Até 3 ativos disponíveis</span>
      </div>
      <div className="two-columns">
        <section className="panel">
          <PanelTitle
            title="Menores retornos × referência"
            subtitle="Retorno percentual no mesmo intervalo"
          />
          <ReturnChart
            rows={[...worst, reference]}
            referenceId={reference.id}
          />
        </section>
        <section className="panel">
          <PanelTitle
            title="Impacto sobre o capital"
            subtitle="Valor final hipotético dos menores retornos"
          />
          <ReturnChart
            rows={[...worst, reference]}
            metric="final"
            referenceId={reference.id}
          />
        </section>
      </div>
      <section className="panel table-panel">
        <PanelTitle
          title="Números por trás dos gráficos"
          subtitle="Ranking dos ativos disponíveis e Renda fixa de referência"
        />
        <ComparisonTable
          rows={[reference, ...filtered(validMarket)]}
          referenceId={reference.id}
        />
      </section>
      <Benchmark row={benchmark} />
    </>
  );
}
