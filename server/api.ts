import { validRange } from "../src/lib/dateRange";
import { shiftDays, monthsAgo } from "../src/lib/finance";
import { z } from "zod";
import type { DataResponse, MarketAsset, Point } from "../src/types";
export const universe = [
  ["PETR4", "Petrobras", "Ação"],
  ["ITUB4", "Itaú Unibanco", "Ação"],
  ["WEGE3", "WEG", "Ação"],
  ["VALE3", "Vale", "Ação"],
  ["IVVB11", "S&P 500 em reais", "ETF"],
  ["BOVA11", "Ibovespa ETF", "ETF"],
  ["HGLG11", "Pátria Log", "FII"],
  ["MXRF11", "Maxi Renda", "FII"],
  ["^BVSP", "Ibovespa", "Índice"],
] as const;
const bcbSchema = z.array(
  z.object({
    data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
    valor: z.string(),
    dataFim: z.string().optional(),
  }),
);
const pointSchema = z.object({
  date: z.number(),
  close: z.number().positive(),
  adjustedClose: z.number().positive().nullable().optional(),
});
const responseSchema = z.object({
  results: z.array(
    z.object({
      symbol: z.string(),
      data: z
        .object({ historicalDataPrice: z.array(pointSchema).optional() })
        .optional(),
    }),
  ),
});
const cache = new Map<string, { until: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
export function clearCache() {
  cache.clear();
  pending.clear();
}
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const job = load()
    .then((value) => {
      if (cache.size >= 120) cache.delete(cache.keys().next().value!);
      cache.set(key, { until: Date.now() + 15 * 60 * 1000, value });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}
async function json(url: string, token?: string) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if ([401, 403].includes(response.status))
      throw new Error(
        "Acesso não liberado. Configure uma chave brapi com cobertura para este histórico.",
      );
    if (response.status === 429)
      throw new Error(
        "Limite de consultas atingido. Aguarde e tente novamente.",
      );
    if (response.status === 400)
      throw new Error("Intervalo não disponível no plano do provedor.");
    throw new Error(`Fonte indisponível (HTTP ${response.status}).`);
  }
  return response.json();
}
const iso = (s: string) => s.split("/").reverse().join("-");
const br = (s: string) => s.split("-").reverse().join("/");
const errorText = (e: unknown) =>
  e instanceof z.ZodError
    ? "A fonte retornou dados em um formato inesperado."
    : e instanceof Error && e.name === "TimeoutError"
      ? "A fonte demorou a responder. Tente novamente."
      : e instanceof Error
        ? e.message
        : "Não foi possível consultar a fonte.";
async function bcbJson(url: string) {
  try {
    return await json(url);
  } catch (error) {
    // Uma repetição apenas para falhas transitórias do SGS, nunca para limite de uso.
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || /HTTP 50[234]/.test(error.message))
    )
      return json(url);
    throw error;
  }
}
// Blocos de até cinco anos: respeita o limite de dez anos por consulta SGS.
async function bcbHistory(series: number, start: string, end: string) {
  const rows: z.infer<typeof bcbSchema> = [];
  for (let from = start; from <= end;) {
    const to = [monthsAgo(from, series === 12 ? -60 : -12), end].sort()[0];
    rows.push(
      ...(await cached(`bcb-${series}-${from}-${to}`, async () =>
        bcbSchema.parse(
          await bcbJson(
            `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados?formato=json&dataInicial=${br(from)}&dataFinal=${br(to)}`,
          ),
        ),
      )),
    );
    from = shiftDays(to, 1);
  }
  return rows;
}
const dailyPoints = (rows: z.infer<typeof bcbSchema>) =>
  rows
    .map((p) => ({
      date: iso(p.data),
      rate: Number(p.valor.replace(",", ".")) / 100,
    }))
    .filter((p) => Number.isFinite(p.rate) && p.rate >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
export async function getData(
  start: string,
  end: string,
  token?: string,
  scope: "all" | "fixed" | "cdi" | "extras" | "market" = "all",
): Promise<DataResponse> {
  const result: DataResponse = {
    fetchedAt: new Date().toISOString(),
    tokenConfigured: !!token,
    cdi: { annual: null, date: null, daily: [] },
    assets: [],
  };
  const cdiJob = async () => {
    const [latest, history] = await Promise.allSettled([
      cached("bcb-latest", async () =>
        bcbSchema.parse(
          await json(
            "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
          ),
        ),
      ),
      bcbHistory(12, start, end),
    ]);
    if (latest.status === "fulfilled" && latest.value.length) {
      const p = latest.value.at(-1)!;
      const rate = Number(p.valor.replace(",", ".")) / 100;
      if (Number.isFinite(rate) && rate >= 0) {
        result.cdi.annual = rate;
        result.cdi.date = iso(p.data);
      }
    }
    if (history.status === "fulfilled")
      result.cdi.daily = history.value
        .map((p) => ({
          date: iso(p.data),
          rate: Number(p.valor.replace(",", ".")) / 100,
        }))
        .filter((p) => Number.isFinite(p.rate) && p.rate >= 0)
        .sort((a, b) => a.date.localeCompare(b.date));
    const errors = [latest, history]
      .filter((r) => r.status === "rejected")
      .map((r) => errorText((r as PromiseRejectedResult).reason));
    if (errors.length) result.cdi.error = errors.join(" ");
  };
  const extraJob = async () => {
    const [selic, savings] = await Promise.allSettled([
      bcbHistory(11, start, end),
      bcbHistory(195, start, end),
    ]);
    result.selic =
      selic.status === "fulfilled"
        ? { daily: dailyPoints(selic.value) }
        : { daily: [], error: errorText(selic.reason) };
    result.savings =
      savings.status === "fulfilled"
        ? {
            periods: savings.value
              .filter((p) => p.dataFim)
              .map((p) => ({
                date: iso(p.data),
                end: iso(p.dataFim!),
                rate: Number(p.valor.replace(",", ".")) / 100,
              }))
              .filter((p) => Number.isFinite(p.rate) && p.rate >= 0),
          }
        : { periods: [], error: errorText(savings.reason) };
  };
  const marketJob = async () => {
    const loadAsset = async ([
      symbol,
      name,
      category,
    ]: (typeof universe)[number]) => {
      const item: MarketAsset = { symbol, name, category, points: [] };
      if (start < monthsAgo(end, 24)) {
        item.error =
          "Período longo disponível para renda fixa. Consulte até dois anos para renda variável, conforme seu plano.";
        return item;
      }
      if (!token && !["PETR4", "VALE3", "ITUB4"].includes(symbol)) {
        item.error = "Requer chave brapi com acesso a este ativo.";
        return item;
      }
      try {
        item.points = await cached(
          `market-${token ?? "public"}-${symbol}-${start}-${end}`,
          async () => {
            const params = new URLSearchParams({
              symbols: symbol,
              startDate: start,
              endDate: end,
              interval: "1d",
              sortOrder: "asc",
            });
            const body = responseSchema.parse(
              await json(
                `https://brapi.dev/api/v2/stocks/historical?${params}`,
                token,
              ),
            );
            const asset = body.results.find((a) => a.symbol === symbol);
            if (!asset?.data?.historicalDataPrice?.length)
              throw new Error(
                "O provedor não retornou histórico para este ativo.",
              );
            const points: Point[] = asset.data.historicalDataPrice.map((p) => ({
              date: new Date(p.date * 1000).toISOString().slice(0, 10),
              close: p.close,
              adjustedClose: p.adjustedClose ?? undefined,
            }));
            return [...new Map(points.map((p) => [p.date, p])).values()].sort(
              (a, b) => a.date.localeCompare(b.date),
            );
          },
        );
      } catch (e) {
        item.error = errorText(e);
      }
      return item;
    };
    // Três ativos por vez: reduz a espera sem disparar todo o universo de uma vez.
    for (let i = 0; i < universe.length; i += 3) {
      result.assets.push(
        ...(await Promise.all(universe.slice(i, i + 3).map(loadAsset))),
      );
    }
  };
  await Promise.all([
    ...(["all", "fixed", "cdi"].includes(scope) ? [cdiJob()] : []),
    ...(["all", "fixed", "extras"].includes(scope) ? [extraJob()] : []),
    ...(["all", "market"].includes(scope) ? [marketJob()] : []),
  ]);
  return result;
}
export async function handleApi(request: Request, token?: string) {
  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? "",
    end = url.searchParams.get("end") ?? "";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (!validRange(start, end, today))
    return Response.json(
      {
        error:
          "Escolha um intervalo válido de até dez anos, sem datas futuras.",
      },
      { status: 400 },
    );
  const requestedScope = url.searchParams.get("scope");
  const scope =
    requestedScope === "fixed" ||
    requestedScope === "cdi" ||
    requestedScope === "extras" ||
    requestedScope === "market"
      ? requestedScope
      : "all";
  const data = await getData(start, end, token, scope);
  return Response.json(data, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
