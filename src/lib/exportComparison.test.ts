import { expect, it } from "vitest";
import { comparisonCsv } from "./exportComparison";
import type { ComparisonRow } from "../types";
const row: ComparisonRow = {id:"A",name:'A; "teste"',category:"Ação",rate:-.02,final:980,difference:-.03,start:"2026-01-01",end:"2026-02-01"};
it("exporta ordem, números, datas e campos indisponíveis", () => {
  const csv = comparisonCsv([row,{...row,name:"LCI",rate:null,final:null,difference:null,error:"Sem dados"}],row,"Histórico");
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv.split("\r\n")).toHaveLength(3);
  expect(csv).toContain('"A; ""teste""";"Ação";-2,00;980,00;-3,00');
  expect(csv).toContain('"LCI";"Ação";;;;');
  expect(csv).toContain('"2026-01-01";"2026-02-01"');
  expect(csv).toContain("Sem dados");
});
it("neutraliza fórmulas textuais preservando números negativos", () => {
  const csv = comparisonCsv([{...row,name:"=1+1"}],row,"Histórico");
  expect(csv).toContain("'=1+1");
  expect(csv).toContain(";-2,00;");
});
