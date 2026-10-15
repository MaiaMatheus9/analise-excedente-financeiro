import { useEffect, useRef, useState } from "react";
import type { DataResponse } from "../types";
const recent = new Map<string, { data: DataResponse; until: number }>();
export function useData(
  start: string,
  end: string,
  refresh: number,
  scope: "all" | "fixed" = "all",
) {
  const lastRefresh = useRef(refresh);
  const [state, setState] = useState<{
    data?: DataResponse;
    loading: boolean;
    error?: string;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    const key = new URLSearchParams({ start, end, scope }).toString();
    const force = lastRefresh.current !== refresh;
    lastRefresh.current = refresh;
    if (force) recent.delete(key);
    const hit = recent.get(key);
    if (!force && hit && hit.until > Date.now()) {
      setState({ data: hit.data, loading: false });
      return () => controller.abort();
    }
    setState({ loading: true });
    fetch(`/api/data?${key}`, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Falha na consulta");
        return body as DataResponse;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        // Falhas parciais devem permitir uma nova tentativa ao revisitar o período.
        if (
          !data.cdi.error &&
          data.cdi.daily.length &&
          !data.selic?.error &&
          !data.savings?.error &&
          !data.assets.some((a) => a.error)
        ) {
          if (recent.size >= 12) recent.delete(recent.keys().next().value!);
          recent.set(key, { data, until: Date.now() + 5 * 60 * 1000 });
        }
        setState({ data, loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            error: "Não foi possível atualizar. " + e.message,
          });
      });
    return () => controller.abort();
  }, [start, end, refresh, scope]);
  return state;
}
