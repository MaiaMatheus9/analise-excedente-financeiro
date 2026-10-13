import type { LucideIcon } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import { dateLabel, percent } from "../lib/finance";
import type { ComparisonRow } from "../types";

export function Kpi({
  icon: Icon,
  label,
  value,
  detail,
  blue = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  blue?: boolean;
}) {
  return (
    <section className={`kpi ${blue ? "blue" : ""}`}>
      <div>
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </section>
  );
}
export function PanelTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="panel-heading">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}
export function Benchmark({ row }: { row?: ComparisonRow }) {
  return (
    <section className="benchmark">
      <div className="benchmark-icon">
        <ChartNoAxesCombined size={23} />
      </div>
      <div>
        <strong>Ibovespa · benchmark de mercado</strong>
        <p>
          Índice em pontos, apresentado separadamente dos ativos negociáveis.
        </p>
      </div>
      <span>
        {row?.rate != null ? percent(row.rate) : "Indisponível"}
        <small>
          {row?.rate != null
            ? `${dateLabel(row.start)} — ${dateLabel(row.end)}`
            : (row?.error ?? "Aguardando consulta")}
        </small>
      </span>
    </section>
  );
}
