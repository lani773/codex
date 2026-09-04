import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { QuestionCard } from "./QuestionCard";
test("submits the selected checkbox values", async () => { const user = userEvent.setup(); const onSubmit = vi.fn(); render(<QuestionCard question={{ id: "devices", goalId: "goal-1", type: "checkbox", title: "Select devices", required: true, options: [{ label: "Lights", value: "lights" }, { label: "Sensors", value: "sensors" }] }} onSubmit={onSubmit} />); await user.click(screen.getByLabelText("Lights")); await user.click(screen.getByLabelText("Sensors")); await user.click(screen.getByRole("button", { name: "Send answer" })); expect(onSubmit).toHaveBeenCalledWith(["lights", "sensors"]); });
test("sends an explicit confirmation decision", async () => { const user = userEvent.setup(); const onSubmit = vi.fn(); render(<QuestionCard question={{ id: "approve", goalId: "goal-1", type: "confirmation", title: "Approve plan", required: true }} onSubmit={onSubmit} />); await user.click(screen.getByRole("button", { name: "Reject" })); expect(onSubmit).toHaveBeenCalledWith(false); });
