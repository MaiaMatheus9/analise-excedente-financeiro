import { useEffect, useState } from "react";
import type { DataResponse } from "../types";
export function useData(start: string, end: string, refresh: number) {
  const [state, setState] = useState<{
    data?: DataResponse;
    loading: boolean;
    error?: string;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    fetch(`/api/data?${new URLSearchParams({ start, end })}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Falha na consulta");
        return body as DataResponse;
      })
      .then((data) => setState({ data, loading: false }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({
            loading: false,
            error: "Não foi possível atualizar. " + e.message,
          });
      });
    return () => controller.abort();
  }, [start, end, refresh]);
  return state;
}
