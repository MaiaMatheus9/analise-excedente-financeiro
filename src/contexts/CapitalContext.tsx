import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type CapitalContextType = {
  capitalAnalisado: number;
  setCapitalAnalisado: (valor: number) => void;
};

const CAPITAL_INICIAL = 30000;

const CapitalContext = createContext<CapitalContextType | null>(null);

export function CapitalProvider({ children }: { children: ReactNode }) {
  const [capitalAnalisado, setCapitalAnalisado] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("capitalAnalisado");
      const value = saved === null ? CAPITAL_INICIAL : Number(saved);
      return Number.isFinite(value) && value >= 1 && value <= 1e10
        ? value
        : CAPITAL_INICIAL;
    } catch {
      return CAPITAL_INICIAL;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("capitalAnalisado", String(capitalAnalisado));
    } catch {
      /* Mantém o contexto em memória. */
    }
  }, [capitalAnalisado]);

  return (
    <CapitalContext.Provider value={{ capitalAnalisado, setCapitalAnalisado }}>
      {children}
    </CapitalContext.Provider>
  );
}

export function useCapitalAnalisado() {
  const context = useContext(CapitalContext);

  if (!context) {
    throw new Error(
      "useCapitalAnalisado deve ser usado dentro de CapitalProvider",
    );
  }

  return context;
}
