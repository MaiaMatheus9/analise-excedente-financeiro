
import type { ComparisonRow } from "../types";
const numeric = (value: number | null, scale = 1) => value === null ? "" : (value * scale).toFixed(2).replace(".", ",");
const cell = (value: string) => {
  const safe = /^[=+@-]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
};
export function comparisonCsv(rows: ComparisonRow[], reference: ComparisonRow, method: string) {
  const headers = ["Investimento", "Categoria", "Retorno (%)", "Valor final (R$)", "Diferença (p.p.)", "Data inicial", "Data final", "Referência", "Método CDI", "Observações"];
  const lines = rows.map((row) => [row.name, row.category, numeric(row.rate, 100), numeric(row.final), numeric(row.difference, 100), row.start, row.end, reference.name, method, [row.error, row.basis, "Valores brutos, antes de impostos e custos."].filter(Boolean).join(" ")]);
  return "\uFEFF" + [headers.map(cell).join(";"), ...lines.map((line) => line.map((value, index) => index >= 2 && index <= 4 ? value : cell(value)).join(";"))].join("\r\n");
}
export function downloadComparison(rows: ComparisonRow[], reference: ComparisonRow, method: string) {
  const url = URL.createObjectURL(new Blob([comparisonCsv(rows, reference, method)], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `comparacao-${reference.start}-a-${reference.end}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
