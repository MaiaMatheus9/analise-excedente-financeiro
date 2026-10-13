import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { analyze } from "../lib/finance";
import type { ComparisonRow, DataResponse, Settings } from "../types";
export interface PageProps {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  analysis: ReturnType<typeof analyze>;
  reference: ComparisonRow;
  data?: DataResponse;
  best: ComparisonRow[];
  validMarket: ComparisonRow[];
  topCount: number;
  worst: ComparisonRow[];
  filtered: (rows: ComparisonRow[]) => ComparisonRow[];
  navigate: (id: string) => void;
  benchmark?: ComparisonRow;
  filterBar: ReactNode;
  all: ComparisonRow[];
  fixed: ComparisonRow[];
  market: ComparisonRow[];
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
}
