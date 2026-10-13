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
          : url.includes("sgs.12")
            ? [{ data: "09/01/2026", valor: "0.050788" }]
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
    expect(d.cdi.daily[0].rate).toBeCloseTo(0.00050788);
    expect(f).toHaveBeenCalledTimes(5);
    await getData("2026-01-05", "2026-01-09");
    expect(f).toHaveBeenCalledTimes(5);
  });
});
