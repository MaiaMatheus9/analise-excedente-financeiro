import { expect, it } from "vitest";
import { savingsReturn, completeDailyReturn, analyze } from "./finance";
import { validRange } from "./dateRange";
it("poupança só credita aniversários completos e usa a taxa já incluindo TR", () => {
  const points = [
    { date: "2025-01-15", end: "2025-02-15", rate: 0.006 },
    { date: "2025-02-15", end: "2025-03-15", rate: 0.007 },
  ];
  expect(savingsReturn(points, "2025-01-15", "2025-02-14")).toBe(0);
  expect(savingsReturn(points, "2025-01-15", "2025-03-16")).toBeCloseTo(
    1.006 * 1.007 - 1,
  );
  expect(savingsReturn([], "2025-01-15", "2025-03-15")).toBeNull();
});
it("poupança de dia 31 começa no primeiro dia do mês seguinte", () => {
  const points = [{ date: "2025-02-01", end: "2025-03-01", rate: 0.006 }];
  expect(savingsReturn(points, "2025-01-31", "2025-02-28")).toBe(0);
  expect(savingsReturn(points, "2025-01-31", "2025-03-01")).toBeCloseTo(0.006);
});
it("Selic diária não usa CDI como substituto e bloqueia lacunas", () => {
  expect(
    completeDailyReturn(
      [{ date: "2026-01-06", rate: 0.001 }],
      "2026-01-05",
      "2026-01-06",
    ),
  ).toBeCloseTo(0.001);
  expect(completeDailyReturn([], "2026-01-05", "2026-01-06")).toBeNull();
});
it("datas personalizadas aceitam dez anos, incluindo bissextos", () => {
  expect(validRange("2016-10-14", "2026-10-14", "2026-10-14")).toBe(true);
  expect(validRange("2016-10-13", "2026-10-14", "2026-10-14")).toBe(false);
  expect(validRange("2026-02-30", "2026-03-01", "2026-10-14")).toBe(false);
  expect(validRange("2026-01-01", "2027-01-01", "2026-10-14")).toBe(false);
});
it("LCI e LCA seguem percentuais próprios sem modificar CDB de referência", () => {
  const result = analyze(
    {
      fetchedAt: "",
      tokenConfigured: false,
      assets: [],
      cdi: {
        annual: 0.1,
        date: "2026-01-06",
        daily: [{ date: "2026-01-06", rate: 0.001 }],
      },
    },
    { rates: [100, 110, 120, 105, 90, 95], reference: 1, method: "historical" },
    1000,
    "2026-01-05",
    "2026-01-06",
  );
  expect(result.fixed).toHaveLength(8);
  expect(result.fixed[4].rate).toBeCloseTo(0.0009);
  expect(result.fixed[5].rate).toBeCloseTo(0.00095);
  expect(result.reference.id).toBe("fixed-1");
  expect(result.fixed[6].rate).toBeNull();
});

it("recalcula diferenças com poupança e Selic como referência", () => {
  const data = { fetchedAt: "", tokenConfigured: true, assets: [],
    cdi: { annual: .1, date: "2026-01-06", daily: [{date: "2026-01-06", rate: .001}] },
    selic: { daily: [{date: "2026-01-06", rate: .002}] }, savings: { periods: [] } };
  for (const reference of [4, 6, 7]) {
    const result = analyze(data, { rates: [100,110,120,105,90,95], reference, method: "historical" }, 1000, "2026-01-05", "2026-01-06");
    expect(result.reference).toBe(result.fixed[reference]);
    expect(result.reference.difference).toBe(0);
    expect(result.fixed[0].difference).toBeCloseTo(result.fixed[0].rate! - result.reference.rate!);
  }
});

it("poupança credita no aniversário exato e acumula ciclos seguintes", () => {
  const periods = [
    {date:"2026-09-14",end:"2026-10-14",rate:.006},
    {date:"2026-10-14",end:"2026-11-14",rate:.007},
  ];
  expect(savingsReturn(periods,"2026-09-14","2026-10-13")).toBe(0);
  expect(savingsReturn(periods,"2026-09-14","2026-10-14")).toBeCloseTo(.006);
  expect(savingsReturn(periods,"2026-09-14","2026-11-14")).toBeCloseTo(1.006*1.007-1);
});
