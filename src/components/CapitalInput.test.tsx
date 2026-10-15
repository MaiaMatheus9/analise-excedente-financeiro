// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { CapitalInput } from "./CapitalInput";
afterEach(cleanup);
function Scenario() {
  const [value, setValue] = useState(3);
  return (
    <>
      <CapitalInput value={value} onChange={setValue} />
      <output>{value}</output>
    </>
  );
}
it("apaga o último dígito e aceita novo capital com centavos", async () => {
  const user = userEvent.setup();
  render(<Scenario />);
  const input = screen.getByLabelText("Capital excedente") as HTMLInputElement;
  await user.clear(input);
  expect(input.value).toBe("");
  expect(screen.getByRole("status").textContent).toBe("3");
  await user.type(input, "2500.50");
  await user.tab();
  expect(input.value).toBe("2500.5");
  expect(screen.getByRole("status").textContent).toBe("2500.5");
});
it("restaura último capital válido ao sair de campo vazio ou inválido", () => {
  render(<Scenario />);
  const input = screen.getByLabelText("Capital excedente") as HTMLInputElement;
  for (const value of ["", "0", "-1", "10000000001"]) {
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
    expect(input.value).toBe("3");
    expect(screen.getByRole("status").textContent).toBe("3");
  }
});
