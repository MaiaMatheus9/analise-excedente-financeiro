// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CapitalProvider } from "../contexts/CapitalContext";
import { SettingsForm } from "./SettingsForm";
it("propaga alteração de taxa sem enviar um formulário e bloqueia valores inválidos", async () => {
  const onChange = vi.fn();
  render(
    <CapitalProvider>
      <SettingsForm
        value={{
          rates: [100, 110, 120, 105],
          reference: 1,
          method: "historical",
        }}
        onChange={onChange}
      />
    </CapitalProvider>,
  );
  fireEvent.change(screen.getByLabelText("CDB B percentual do CDI"), {
    target: { value: "115" },
  });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(onChange.mock.calls.at(-1)![0].rates[1]).toBe(115);
  onChange.mockClear();
  fireEvent.change(screen.getByLabelText("CDB B percentual do CDI"), {
    target: { value: "999" },
  });
  await waitFor(() =>
    expect(screen.getByText("Máximo de 500% do CDI.")).toBeTruthy(),
  );
  expect(onChange).not.toHaveBeenCalled();
});

afterEach(cleanup);
it("restaura taxas inválidas preservando referência e método", async () => {
  const onChange = vi.fn();
  render(<CapitalProvider><SettingsForm value={{ rates: [150,155,160,140,95,98], reference: 7, method: "estimate" }} onChange={onChange} /></CapitalProvider>);
  fireEvent.change(screen.getByLabelText("LCI percentual do CDI"), {target:{value:"999"}});
  await waitFor(() => expect(screen.getByText("Máximo de 500% do CDI.")).toBeTruthy());
  onChange.mockClear();
  fireEvent.click(screen.getByRole("button", {name:"Restaurar taxas padrão"}));
  expect(onChange).toHaveBeenCalledWith({rates:[100,110,120,105,90,90],reference:7,method:"estimate"});
  expect((screen.getByLabelText("LCI percentual do CDI") as HTMLInputElement).value).toBe("90");
});
