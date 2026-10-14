import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCapitalAnalisado } from "../contexts/CapitalContext";
import type { Settings } from "../types";
const settingsFormSchema = z.object({
  capital: z.coerce
    .number()
    .min(1, "Informe pelo menos R$ 1.")
    .max(1e10, "Capital acima do limite."),
  rates: z
    .array(
      z.coerce
        .number()
        .min(0, "Use um percentual positivo.")
        .max(500, "Máximo de 500% do CDI."),
    )
    .length(4),
  reference: z.coerce.number().int().min(0).max(2),
  method: z.enum(["historical", "estimate"]),
});
export const settingsSchema = settingsFormSchema.omit({ capital: true });
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
    values: { ...value, capital: capitalAnalisado },
    mode: "onChange",
  });
  function submit({ capital, ...settings }: SettingsFormValues) {
    setCapitalAnalisado(capital);
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
          <input
            type="number"
            min="1"
            max="10000000000"
            step="100"
            {...register("capital")}
          />
          {errors.capital && (
            <small className="negative">{errors.capital.message}</small>
          )}
        </label>
        <label>
          CDB de referência
          <select {...register("reference")}>
            <option value="0">CDB A</option>
            <option value="1">CDB B</option>
            <option value="2">CDB C</option>
          </select>
        </label>
        <label className="span-two">
          Método da renda fixa
          <select {...register("method")}>
            <option value="historical">
              CDI histórico — taxas observadas no período
            </option>
            <option value="estimate">
              CDI atual — estimativa com taxa constante
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
        {["CDB A", "CDB B", "CDB C", "RDB"].map((name, i) => (
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
        As alterações válidas atualizam a comparação automaticamente.
      </p>
    </form>
  );
}
