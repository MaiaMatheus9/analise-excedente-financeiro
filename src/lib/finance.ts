import type { CdiPoint, ComparisonRow, DataResponse, Settings } from "../types";
export const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
export const percent = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
export const dateLabel = (v: string) =>
  v
    ? new Date(v + "T12:00:00Z").toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "—";
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function shiftDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monthsAgo(date: string, months: number) {
  const d = new Date(date + "T12:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
// Calendário nacional + feriados móveis. Sessões excepcionais da B3 não estão incluídas.
function easter(year: number) {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function isBusinessDay(date: string) {
  const d = new Date(date + "T12:00:00Z"),
    year = d.getUTCFullYear(),
    md = date.slice(5);
  if ([0, 6].includes(d.getUTCDay())) return false;
  if (
    [
      "01-01",
      "04-21",
      "05-01",
      "09-07",
      "10-12",
      "11-02",
      "11-15",
      "12-25",
      ...(year >= 2024 ? ["11-20"] : []),
    ].includes(md)
  )
    return false;
  return ![-48, -47, -2, 60]
    .map((n) => shiftDays(easter(year), n))
    .includes(date);
}
export function businessDays(start: string, end: string) {
  let count = 0;
  for (let day = shiftDays(start, 1); day <= end; day = shiftDays(day, 1))
    if (isBusinessDay(day)) count++;
  return count;
}
export function estimatedReturn(
  annual: number,
  multiple: number,
  days: number,
) {
  return Math.pow(1 + (Math.pow(1 + annual, 1 / 252) - 1) * multiple, days) - 1;
}
export function spreadsheetReturn(
  annual: number,
  multiple: number,
  days: number,
) {
  return Math.pow(1 + annual, (multiple * days) / 252) - 1;
}
export function historicalReturn(
  daily: CdiPoint[],
  multiple: number,
  start: string,
  end: string,
) {
  const points = daily.filter((p) => p.date > start && p.date <= end);
  return points.length
    ? points.reduce((factor, p) => factor * (1 + p.rate * multiple), 1) - 1
    : null;
}
export function rank(rows: ComparisonRow[], count: number, ascending = false) {
  return rows
    .filter(
      (r) =>
        r.rate !== null &&
        r.category !== "Índice" &&
        r.category !== "Renda fixa",
    )
    .sort(
      (a, b) =>
        (ascending ? 1 : -1) * (a.rate! - b.rate!) || a.id.localeCompare(b.id),
    )
    .slice(0, count);
}
export function analyze(
  data: DataResponse | undefined,
  settings: Settings,
  start: string,
  end: string,
) {
  const lastDaily = data?.cdi.daily.at(-1)?.date;
  const cutoff = [
    end,
    shiftDays(today(), -1),
    ...(settings.method === "historical" && lastDaily ? [lastDaily] : []),
  ].sort()[0];
  const available = (data?.assets ?? []).filter(
    (a) =>
      a.category !== "Índice" &&
      a.points.filter((p) => p.date >= start && p.date <= cutoff).length >= 2,
  );
  const dateSets = available.map(
    (a) =>
      new Set(
        a.points
          .filter((p) => p.date >= start && p.date <= cutoff)
          .map((p) => p.date),
      ),
  );
  const common = dateSets.length
    ? [...dateSets[0]]
        .filter((date) => dateSets.every((set) => set.has(date)))
        .sort()
    : [];
  const effectiveStart = common.length >= 2 ? common[0] : start,
    effectiveEnd = common.length >= 2 ? common[common.length - 1] : cutoff;
  const daily = data?.cdi.daily ?? [],
    days = businessDays(effectiveStart, effectiveEnd);
  const relevant = daily.filter(
    (p) => p.date > effectiveStart && p.date <= effectiveEnd,
  );
  const complete = Array.from(
    {
      length: Math.max(
        0,
        Math.round(
          (Date.parse(effectiveEnd) - Date.parse(effectiveStart)) / 86400000,
        ),
      ),
    },
    (_, i) => shiftDays(effectiveStart, i + 1),
  )
    .filter(isBusinessDay)
    .every((d) => relevant.some((p) => p.date === d));
  const getReturn = (multiple: number) =>
    settings.method === "historical"
      ? complete
        ? historicalReturn(daily, multiple, effectiveStart, effectiveEnd)
        : null
      : data?.cdi.annual != null
        ? estimatedReturn(data.cdi.annual, multiple, days)
        : null;
  const ref = getReturn(settings.rates[settings.reference] / 100);
  const fixed: ComparisonRow[] = settings.rates.map((p, i) => {
    const rate = getReturn(p / 100);
    return {
      id: `fixed-${i}`,
      name: `${["CDB A", "CDB B", "CDB C", "RDB"][i]} · ${p}% CDI`,
      category: "Renda fixa",
      rate,
      final: rate === null ? null : settings.capital * (1 + rate),
      difference: rate === null || ref === null ? null : rate - ref,
      start: effectiveStart,
      end: effectiveEnd,
      error:
        rate === null
          ? "CDI indisponível ou incompleto para o intervalo."
          : undefined,
    };
  });
  const market: ComparisonRow[] = (data?.assets ?? []).map((a) => {
    const points = a.points.filter(
      (p) => p.date >= effectiveStart && p.date <= effectiveEnd,
    );
    const valid =
      common.length >= 2 &&
      points.length >= 2 &&
      points[0].date === effectiveStart &&
      points[points.length - 1].date === effectiveEnd;
    const adjusted =
      points.length > 0 && points.every((p) => p.adjustedClose != null);
    const initial = adjusted ? points[0]?.adjustedClose : points[0]?.close,
      last = adjusted ? points.at(-1)?.adjustedClose : points.at(-1)?.close;
    const rate = valid && initial && last ? last / initial - 1 : null;
    return {
      id: a.symbol,
      name: a.symbol,
      category: a.category,
      rate,
      final: rate === null ? null : settings.capital * (1 + rate),
      difference: rate === null || ref === null ? null : rate - ref,
      start: effectiveStart,
      end: effectiveEnd,
      initial,
      last,
      points: points.map((p) => ({
        ...p,
        close: adjusted ? p.adjustedClose! : p.close,
      })),
      basis: points.length === 0
        ? undefined
        : adjusted
          ? "Série ajustada pelo provedor"
          : "Fechamento do provedor; ajustes não uniformes",
      error:
        a.error ??
        (rate === null
          ? "Histórico insuficiente nas datas comuns."
          : undefined),
    };
  });
  return {
    fixed,
    market,
    reference: fixed[settings.reference],
    start: effectiveStart,
    end: effectiveEnd,
    days,
    observations: relevant.length,
    aligned: common.length >= 2,
  };
}
