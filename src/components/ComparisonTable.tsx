import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { dateLabel, money, percent } from "../lib/finance";
import type { ComparisonRow } from "../types";
export function ComparisonTable({
  rows,
  referenceId,
  prices = false,
  onShorterPeriod,
}: {
  rows: ComparisonRow[];
  referenceId: string;
  prices?: boolean;
  onShorterPeriod?: () => void;
}) {
  const unavailable = onShorterPeriod ? rows.filter((r) => r.rate === null) : [];
  const visible = onShorterPeriod ? rows.filter((r) => r.rate !== null) : rows;
  return (
    <>
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Alternativa</th>
            <th>Categoria</th>
            {prices && (
              <>
                <th>Inicial → final</th>
                <th>Datas das cotações</th>
              </>
            )}
            <th>Retorno</th>
            <th>Valor final</th>
            <th>vs. referência</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr
              key={r.id}
              className={r.id === referenceId ? "reference-row" : ""}
            >
              <td>
                <strong>{r.name}</strong>
                {r.id === referenceId && (
                  <span className="small-tag">Referência</span>
                )}
                {r.error && <small className="row-error">{r.error}</small>}
                {prices && r.basis && <small>{r.basis}</small>}
              </td>
              <td>
                <span className="category">{r.category}</span>
              </td>
              {prices && (
                <>
                  <td>
                    {r.rate !== null && r.initial && r.last
                      ? `${r.category === "Índice" ? r.initial.toLocaleString("pt-BR") : money(r.initial)} → ${r.category === "Índice" ? r.last.toLocaleString("pt-BR") + " pts" : money(r.last)}`
                      : "—"}
                  </td>
                  <td>
                    {r.rate !== null
                      ? `${dateLabel(r.start)} → ${dateLabel(r.end)}`
                      : "—"}
                  </td>
                </>
              )}
              <td
                className={
                  r.rate !== null && r.rate < 0 ? "negative" : "positive"
                }
              >
                {r.rate === null ? "—" : percent(r.rate)}
              </td>
              <td>{r.final === null ? "—" : money(r.final)}</td>
              <td>
                {r.difference === null ? (
                  "—"
                ) : (
                  <span
                    className={`delta ${Math.abs(r.difference) < 1e-10 ? "neutral" : r.difference > 0 ? "positive" : "negative"}`}
                  >
                    {Math.abs(r.difference) < 1e-10 ? (
                      <Minus size={14} />
                    ) : r.difference > 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}{" "}
                    {(r.difference * 100).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    p.p.
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && (
        <p className="table-empty">Nenhuma alternativa com retorno disponível nesta seleção.</p>
      )}
    </div>
    {unavailable.length > 0 && (
      <div className="availability-note">
        <details>
          <summary>
            {unavailable.length} {unavailable.length === 1 ? "ativo sem histórico disponível" : "ativos sem histórico disponível"} neste período
          </summary>
          <p>A disponibilidade depende do período e da fonte. Estes ativos não entram no ranking nem nos gráficos de retorno.</p>
          <ul>
            {unavailable.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong>
                <span>{r.error || "Sem dados suficientes para comparar este período."}</span>
              </li>
            ))}
          </ul>
        </details>
        <button type="button" className="button secondary" onClick={onShorterPeriod}>
          Ver período de 3 meses
        </button>
        <small>Altera o período da análise em todas as abas.</small>
      </div>
    )}
    </>
  );
}


