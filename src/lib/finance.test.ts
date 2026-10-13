import { describe, expect, it } from "vitest";
import type { ComparisonRow, DataResponse, Settings } from "../types";
import {
  analyze,
  businessDays,
  estimatedReturn,
  historicalReturn,
  isBusinessDay,
  monthsAgo,
  rank,
  spreadsheetReturn,
} from "./finance";
const settings: Settings = {
  capital: 30000,
  rates: [100, 110, 120, 105],
  reference: 1,
  method: "historical",
};
const data: DataResponse = {
  fetchedAt: "2026-01-09",
  tokenConfigured: false,
  cdi: {
    annual: 0.1365,
    date: "2026-01-09",
    daily: [
      { date: "2026-01-06", rate: 0.0005 },
      { date: "2026-01-07", rate: 0.0005 },
      { date: "2026-01-08", rate: 0.0005 },
      { date: "2026-01-09", rate: 0.0005 },
    ],
  },
  assets: [
    {
      symbol: "AAA",
      name: "A",
      category: "Ação",
      points: [
        { date: "2026-01-05", close: 10 },
        { date: "2026-01-09", close: 11 },
      ],
    },
    {
      symbol: "BBB",
      name: "B",
      category: "ETF",
      points: [
        { date: "2026-01-05", close: 20 },
        { date: "2026-01-09", close: 18 },
      ],
    },
  ],
};
describe("cálculos financeiros", () => {
  it("reproduz exemplo original e distingue capitalização diária", () => {
    expect(spreadsheetReturn(0.1365, 1.1, 30) * 30000).toBeCloseTo(506.91, 2);
    expect(estimatedReturn(0.1365, 1.1, 30)).not.toBe(
      spreadsheetReturn(0.1365, 1.1, 30),
    );
  });
  it("100% CDI por 252 dias equivale à taxa anual", () =>
    expect(estimatedReturn(0.1365, 1, 252)).toBeCloseTo(0.1365, 10));
  it("acumula percentual do CDI nas taxas diárias", () =>
    expect(
      historicalReturn(data.cdi.daily, 1.1, "2026-01-05", "2026-01-09"),
    ).toBeCloseTo(1.00055 ** 4 - 1, 12));
  it("retorna nulo sem observações", () =>
    expect(historicalReturn([], 1, "2026-01-05", "2026-01-09")).toBeNull());
  it("não confunde dias corridos e úteis e exclui feriados", () => {
    expect(businessDays("2026-10-09", "2026-10-13")).toBe(1);
    expect(isBusinessDay("2026-04-03")).toBe(false);
    expect(isBusinessDay("2026-02-17")).toBe(false);
    expect(isBusinessDay("2026-11-20")).toBe(false);
  });
  it("preserva fim de mês ao subtrair meses", () =>
    expect(monthsAgo("2026-03-31", 1)).toBe("2026-02-28"));
  it("calcula valor final e diferença em pontos percentuais", () => {
    const a = analyze(data, settings, "2026-01-05", "2026-01-09");
    expect(a.market[0].final).toBeCloseTo(33000);
    expect(a.market[0].difference).toBeCloseTo(0.1 - a.reference.rate!);
    expect(a.fixed[1].difference).toBe(0);
  });
  it("atualiza taxa, nome e referência a partir do input", () => {
    const a = analyze(
      data,
      { ...settings, rates: [100, 115, 120, 105] },
      "2026-01-05",
      "2026-01-09",
    );
    expect(a.reference.name).toContain("115%");
    expect(a.reference.rate).toBeCloseTo(1.000575 ** 4 - 1);
  });
  it("não calcula CDI histórico incompleto", () => {
    const a = analyze(
      {
        ...data,
        cdi: {
          ...data.cdi,
          daily: data.cdi.daily.filter((p) => p.date !== "2026-01-07"),
        },
      },
      settings,
      "2026-01-05",
      "2026-01-09",
    );
    expect(a.reference.rate).toBeNull();
  });
  it("alinha o mercado ao último CDI publicado", () => {
    const a = analyze(data, settings, "2026-01-05", "2026-01-12");
    expect(a.end).toBe("2026-01-09");
    expect(a.reference.rate).not.toBeNull();
  });
  it("não inventa preços quando faltam dados", () => {
    const a = analyze(
      {
        ...data,
        assets: [
          {
            symbol: "AAA",
            name: "A",
            category: "Ação",
            points: [],
            error: "Indisponível",
          },
        ],
      },
      settings,
      "2026-01-05",
      "2026-01-09",
    );
    expect(a.market[0].rate).toBeNull();
    expect(a.market[0].final).toBeNull();
  });
  it("usa datas comuns para evitar períodos incompatíveis", () => {
    const d = {
      ...data,
      assets: [
        data.assets[0],
        {
          ...data.assets[1],
          points: [
            { date: "2026-01-06", close: 20 },
            { date: "2026-01-09", close: 21 },
          ],
        },
      ],
    };
    const a = analyze(d, settings, "2026-01-05", "2026-01-09");
    expect(a.market.every((r) => r.rate === null)).toBe(true);
  });
  it("ranking exclui índice, renda fixa e dados ausentes, sem repetir empates", () => {
    const a = analyze(data, settings, "2026-01-05", "2026-01-09");
    const rows: ComparisonRow[] = [
      ...a.market,
      ...a.fixed,
      { ...a.market[0], id: "INDEX", category: "Índice", rate: 10 },
      { ...a.market[0], id: "NULL", rate: null },
      { ...a.market[0], id: "TIE" },
    ];
    expect(rank(rows, 4).map((r) => r.id)).toEqual(["AAA", "TIE", "BBB"]);
    expect(rank(rows, 3, true).map((r) => r.id)).toEqual(["BBB", "AAA", "TIE"]);
  });
});
