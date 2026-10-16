import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCache, getData, handleApi } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  clearCache();
});
describe("integração de dados", () => {
  it("rejeita datas inválidas antes de consultar fontes", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const response = await handleApi(
      new Request("http://localhost/api/data?start=2026-02-30&end=2026-03-01"),
    );
    expect(response.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("preserva indisponibilidade e não cria cotações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 429 })),
    );
    const d = await getData("2026-01-05", "2026-01-09");
    expect(d.assets).toHaveLength(9);
    expect(d.assets.every((a) => a.points.length === 0 && a.error)).toBe(true);
    expect(d.cdi.annual).toBeNull();
    expect(d.cdi.error).toContain("Limite");
  });
  it("normaliza unidades, consulta somente ativos públicos e usa cache", async () => {
    const f = vi.fn(async (url: string) =>
      Response.json(
        url.includes("4389")
          ? [{ data: "09/01/2026", valor: "13.65" }]
          : url.includes("sgs.12") || url.includes("sgs.11")
            ? [{ data: "09/01/2026", valor: "0.050788" }]
            : url.includes("sgs.195")
              ? [{ data: "05/01/2026", dataFim: "05/02/2026", valor: "0.6" }]
              : {
                  results: [
                    {
                      symbol: new URL(url).searchParams.get("symbols"),
                      data: {
                        historicalDataPrice: [
                          { date: 1767970800, close: 10, adjustedClose: 10 },
                        ],
                      },
                    },
                  ],
                },
      ),
    );
    vi.stubGlobal("fetch", f);
    const d = await getData("2026-01-05", "2026-01-09");
    expect(d.cdi.annual).toBe(0.1365);
    expect(d.selic?.daily[0].rate).toBeCloseTo(0.00050788);
    expect(d.savings?.periods[0]).toEqual({
      date: "2026-01-05",
      end: "2026-02-05",
      rate: 0.006,
    });
    expect(d.cdi.daily[0].rate).toBeCloseTo(0.00050788);
    expect(f).toHaveBeenCalledTimes(7);
    await getData("2026-01-05", "2026-01-09");
    expect(f).toHaveBeenCalledTimes(7);
  });
});

it("aceita dez anos, divide as consultas SGS e não pede histórico longo à brapi", async () => {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      return Response.json([]);
    }),
  );
  const response = await handleApi(
    new Request("http://localhost/api/data?start=2016-01-01&end=2026-01-01"),
  );
  expect(response.status).toBe(200);
  expect(calls.some((url) => url.includes("brapi"))).toBe(false);
  expect(calls.filter((url) => url.includes("sgs.12/"))).toHaveLength(2);
  const body = await response.json();
  expect(
    body.assets.every((a: { error?: string }) =>
      a.error?.includes("renda fixa"),
    ),
  ).toBe(true);
});
it("rejeita mais de dez anos sem consultar fontes", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const response = await handleApi(
    new Request("http://localhost/api/data?start=2015-12-31&end=2026-01-01"),
  );
  expect(response.status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("consulta renda fixa sem aguardar nem chamar a brapi", async () => {
  const f = vi.fn(async (_url: string) => Response.json([]));
  vi.stubGlobal("fetch", f);
  const response = await handleApi(
    new Request(
      "http://localhost/api/data?start=2025-01-01&end=2026-01-01&scope=fixed",
    ),
  );
  expect(response.status).toBe(200);
  expect(f.mock.calls.every((args) => !String(args[0]).includes("brapi"))).toBe(
    true,
  );
  const body = await response.json();
  expect(body.assets).toEqual([]);
  expect(body.selic).toBeDefined();
  expect(body.savings).toBeDefined();
});

it("isola as fontes para não bloquear o CDI com outras consultas", async () => {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      return Response.json([]);
    }),
  );
  await getData("2026-09-14", "2026-10-14", undefined, "cdi");
  expect(calls).toHaveLength(2);
  expect(
    calls.every((url) => url.includes("sgs.12/") || url.includes("4389")),
  ).toBe(true);
  calls.length = 0;
  await getData("2026-09-14", "2026-10-14", undefined, "extras");
  expect(calls).toHaveLength(2);
  expect(
    calls.every((url) => url.includes("sgs.11/") || url.includes("sgs.195/")),
  ).toBe(true);
});
