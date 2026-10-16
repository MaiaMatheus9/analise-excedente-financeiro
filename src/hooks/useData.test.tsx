// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { clearDataCache, useData } from "./useData";
const part = {
  fetchedAt: "2026-10-15",
  tokenConfigured: true,
  cdi: {
    annual: 0.13,
    date: "2026-10-14",
    daily: [{ date: "2026-10-14", rate: 0.0005 }],
  },
  assets: [],
};
afterEach(() => {
  cleanup();
  clearDataCache();
  vi.unstubAllGlobals();
});
it("mostra CDI antes da bolsa e reutiliza consultas ao trocar de aba", async () => {
  let finishMarket!: (r: Response) => void;
  const f = vi.fn((url: string) =>
    url.includes("scope=market")
      ? new Promise<Response>((resolve) => {
          finishMarket = resolve;
        })
      : Promise.resolve(Response.json(part)),
  );
  vi.stubGlobal("fetch", f);
  const { result, rerender } = renderHook(
    ({ scope }: { scope: "all" | "fixed" }) =>
      useData("2026-09-14", "2026-10-14", 0, scope),
    { initialProps: { scope: "all" } },
  );
  await waitFor(() => expect(result.current.data?.cdi.daily).toHaveLength(1));
  expect(result.current.loading).toBe(true);
  rerender({ scope: "fixed" });
  await waitFor(() => expect(result.current.loading).toBe(false));
  rerender({ scope: "all" });
  await act(async () => {
    finishMarket(
      Response.json({
        ...part,
        assets: [{ symbol: "PETR4", points: [], error: "Sem cobertura" }],
      }),
    );
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data?.assets).toHaveLength(1);
  expect(result.current.data?.cdi.daily).toHaveLength(1);
  expect(f).toHaveBeenCalledTimes(3);
});
it("ignora respostas antigas e permite atualização manual", async () => {
  let finishOld!: (r: Response) => void;
  const f = vi.fn((url: string) =>
    url.includes("start=2026-09-14")
      ? new Promise<Response>((resolve) => {
          if (url.includes("scope=cdi")) finishOld = resolve;
        })
      : Promise.resolve(Response.json(part)),
  );
  vi.stubGlobal("fetch", f);
  const { result, rerender } = renderHook(
    ({ start, refresh }) => useData(start, "2026-10-14", refresh, "fixed"),
    { initialProps: { start: "2026-09-14", refresh: 0 } },
  );
  rerender({ start: "2026-08-14", refresh: 0 });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    finishOld(Response.json({ ...part, cdi: { ...part.cdi, annual: 0.99 } }));
  });
  expect(result.current.data?.cdi.annual).toBe(0.13);
  rerender({ start: "2026-08-14", refresh: 1 });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(f).toHaveBeenCalledTimes(6);
});
