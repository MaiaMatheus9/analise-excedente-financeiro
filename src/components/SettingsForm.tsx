import { CapitalInput } from "./CapitalInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCapitalAnalisado } from "../contexts/CapitalContext";
import type { Settings } from "../types";
const settingsFormSchema = z.object({
  rates: z
    .array(
      z.coerce
        .number()
        .min(0, "Use um percentual positivo.")
        .max(500, "Máximo de 500% do CDI."),
    )
    .length(6),
  reference: z.coerce.number().int().min(0).max(7),
  method: z.enum(["historical", "estimate"]),
});
export const settingsSchema = settingsFormSchema;
type SettingsFormValues = z.infer<typeof settingsFormSchema>;
export function SettingsForm({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (s: Settings) => void;
}) {
  const { capitalAnalisado, setCapitalAnalisado } = useCapitalAnalisado();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: {
      ...value,
      rates: [
        ...value.rates.slice(0, 4),
        value.rates[4] ?? 90,
        value.rates[5] ?? 90,
      ],
    },
    mode: "onChange",
  });
  function submit(settings: SettingsFormValues) {
    onChange(settings);
  }
  return (
    <form
      onSubmit={handleSubmit(submit)}
      onChange={() => {
        void handleSubmit(submit)();
      }}
      className="settings-form"
    >
      <div className="input-grid">
        <label>
          Capital excedente (R$)
          <CapitalInput
            value={capitalAnalisado}
            onChange={setCapitalAnalisado}
            label="Capital excedente (R$)"
          />
        </label>
        <label>
          Renda fixa de referência
          <select {...register("reference")}>
            <option value="0">CDB A</option>
            <option value="1">CDB B</option>
            <option value="2">CDB C</option>
            <option value="3">RDB</option>
            <option value="4">LCI</option>
            <option value="5">LCA</option>
            <option value="6">Tesouro Selic · estimativa</option>
            <option value="7">Poupança</option>
          </select>
        </label>
        <label className="span-two">
          Método da renda fixa
          <select {...register("method")}>
            <option value="historical">
              CDI histórico — CDB, RDB, LCI e LCA
            </option>
            <option value="estimate">
              CDI atual — estimativa de CDB, RDB, LCI e LCA
            </option>
          </select>
        </label>
      </div>
      <h3>Ofertas que você deseja comparar</h3>
      <p className="muted">
        Percentuais ilustrativos e editáveis. Preencha com as condições
        oferecidas pelo seu banco.
      </p>
      <div className="rate-grid">
        {["CDB A", "CDB B", "CDB C", "RDB", "LCI", "LCA"].map((name, i) => (
          <label key={name}>
            {name}
            <div className="suffix-input">
              <input
                aria-label={`${name} percentual do CDI`}
                type="number"
                min="0"
                max="500"
                step="1"
                {...register(`rates.${i}` as const)}
              />
              <span>% CDI</span>
            </div>
            {errors.rates?.[i] && (
              <small className="negative">{errors.rates[i]?.message}</small>
            )}
          </label>
        ))}
      </div>
      <p className="form-note">
        Tesouro Selic estimado e poupança usam suas próprias séries históricas
        do Banco Central. Comparação bruta: tributos, taxas, vencimentos e
        carências não são modelados.
      </p>
      <p className="form-note">
        As alterações válidas atualizam a comparação automaticamente.
      </p>
    </form>
  );
}
