
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
    if (typeof window === "undefined") return 0;

    const salvo = localStorage.getItem("capitalAnalisado");
    return salvo !== null ? Number(salvo) : CAPITAL_INICIAL;
  });

  useEffect(() => {
    localStorage.setItem("capitalAnalisado", String(capitalAnalisado));
  }, [capitalAnalisado]);

  return (
    <CapitalContext.Provider
      value={{ capitalAnalisado, setCapitalAnalisado }}
    >
      {children}
    </CapitalContext.Provider>
  );
}

export function useCapitalAnalisado() {
  const context = useContext(CapitalContext);

  if (!context) {
    throw new Error(
      "useCapitalAnalisado deve ser usado dentro de CapitalProvider"
    );
  }

  return context;
}
