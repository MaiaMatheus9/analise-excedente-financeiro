import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dateLabel, money, percent } from "../lib/finance";
import type { ComparisonRow } from "../types";
export function Empty({
  message = "Os gráficos aparecerão quando houver dados disponíveis.",
}: {
  message?: string;
}) {
  return (
    <div className="empty">
      <BarChart3 size={30} />
      <strong>Aguardando dados para comparar</strong>
      <p>{message}</p>
    </div>
  );
}
export function ReturnChart({
  rows,
  metric = "rate",
  referenceId,
}: {
  rows: ComparisonRow[];
  metric?: "rate" | "final";
  referenceId: string;
}) {
  const data = rows
    .filter((r) => r[metric] !== null)
    .map((r) => ({
      name: r.category === "Renda fixa" ? r.name.split(" · ")[0] : r.name,
      value: metric === "rate" ? r.rate! * 100 : r.final!,
      id: r.id,
    }));
  if (!data.length) return <Empty />;
  return (
    <div
      className="chart"
      role="img"
      aria-label={
        metric === "rate"
          ? "Gráfico de retorno percentual. Valores na tabela de comparação."
          : "Gráfico de valor final. Valores na tabela de comparação."
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="var(--chart-grid)"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
          />
          <YAxis
            width={metric === "final" ? 72 : 52}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            tickFormatter={(v) =>
              metric === "rate"
                ? `${Number(v).toLocaleString("pt-BR")}%`
                : Math.abs(v) < 1000
                  ? Number(v).toLocaleString("pt-BR")
                  : `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
            }
          />
          <Tooltip
            cursor={{ fill: "var(--chart-cursor)" }}
            formatter={(v) =>
              metric === "rate" ? percent(Number(v) / 100) : money(Number(v))
            }
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--chart-grid)",
              background: "var(--chart-tooltip-bg)",
              color: "var(--chart-axis)",
            }}
          />
          <ReferenceLine y={0} stroke="var(--chart-grid)" />
          <Bar
            dataKey="value"
            name={metric === "rate" ? "Retorno" : "Valor final"}
            radius={[5, 5, 0, 0]}
            maxBarSize={54}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell
                key={d.id}
                fill={
                  d.id === referenceId
                    ? "var(--chart-reference)"
                    : d.value < 0
                      ? "var(--chart-negative)"
                      : "var(--chart-positive)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function HistoryChart({ rows }: { rows: ComparisonRow[] }) {
  const available = rows.filter((r) => r.rate !== null && r.points?.length);
  if (!available.length)
    return (
      <Empty message="Selecione um ativo com histórico disponível para visualizar sua evolução." />
    );
  const dates = [
    ...new Set(available.flatMap((r) => r.points!.map((p) => p.date))),
  ].sort();
  const data = dates.map((date) =>
    Object.fromEntries([
      ["date", date],
      ...available.map((r) => {
        const p = r.points!.find((p) => p.date === date);
        return [r.id, p ? (p.close / r.points![0].close - 1) * 100 : null];
      }),
    ]),
  );
  return (
    <div
      className="chart large"
      role="img"
      aria-label="Evolução do retorno acumulado em percentual"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 15, right: 16, left: 0, bottom: 12 }}
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="var(--chart-grid)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => dateLabel(v).slice(0, 5)}
            minTickGap={35}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
          />
          <Tooltip
            labelFormatter={(v) => dateLabel(String(v))}
            formatter={(v) => percent(Number(v) / 100)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--chart-grid)",
              background: "var(--chart-tooltip-bg)",
              color: "var(--chart-axis)",
            }}
          />
          <ReferenceLine y={0} stroke="var(--chart-grid)" />
          <Legend iconType="circle" />
          {available.map((r, i) => (
            <Line
              key={r.id}
              type="linear"
              dataKey={r.id}
              name={r.name}
              stroke={
                [
                  "var(--chart-series-1)",
                  "var(--chart-series-2)",
                  "var(--chart-series-3)",
                  "var(--chart-series-4)",
                ][i % 4]
              }
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
