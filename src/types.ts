export type Category = "Ação" | "ETF" | "FII" | "Índice";
export interface Point {
  date: string;
  close: number;
  adjustedClose?: number;
}
export interface MarketAsset {
  symbol: string;
  name: string;
  category: Category;
  points: Point[];
  error?: string;
}
export interface CdiPoint {
  date: string;
  rate: number;
}
export interface SavingsPoint extends CdiPoint {
  end: string;
}
export interface DataResponse {
  selic?: { daily: CdiPoint[]; error?: string };
  savings?: { periods: SavingsPoint[]; error?: string };
  fetchedAt: string;
  cdi: {
    annual: number | null;
    date: string | null;
    daily: CdiPoint[];
    error?: string;
  };
  assets: MarketAsset[];
  tokenConfigured: boolean;
}
export interface Settings {
  rates: number[];
  reference: number;
  method: "historical" | "estimate";
}
export interface ComparisonRow {
  id: string;
  name: string;
  category: string;
  rate: number | null;
  final: number | null;
  difference: number | null;
  start: string;
  end: string;
  initial?: number;
  last?: number;
  points?: Point[];
  basis?: string;
  error?: string;
}
