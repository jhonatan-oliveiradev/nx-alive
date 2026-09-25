// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CharacterStudio } from "./character-studio";
import { storageKey } from "./store";
import { importSvg } from "./export";
vi.mock("@nx-alive/react/three",()=>({Character3D:()=>null}));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Studio user flows", () => {
  it("creates, selects and persists a character through the UI", async () => {
    render(<CharacterStudio />);
    fireEvent.click(screen.getByRole("button", { name: "New character" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Peach" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create character" }));
    expect(
      screen
        .getByRole("button", { name: "Peach Peach" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(storageKey)!).characters.at(-1).name,
      ).toBe("Peach"),
    );
    cleanup();
    render(<CharacterStudio />);
    expect(
      screen
        .getByRole("button", { name: "Peach Peach" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("updates pose, undoes and redoes, selects expressions and animations", () => {
    render(<CharacterStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Pose" }));
    const rotation = screen.getByRole("spinbutton", {
      name: "Rotation Z",
    }) as HTMLInputElement;
    fireEvent.change(rotation, { target: { value: "18" } });
    expect(rotation.value).toBe("18");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(rotation.value).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(rotation.value).toBe("18");
    fireEvent.click(screen.getByRole("button", { name: "Expressions" }));
    fireEvent.click(screen.getByRole("button", { name: "Bloop Happy" }));
    expect(
      screen
        .getByRole("button", { name: "Bloop Happy" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Animations" }));
    fireEvent.click(screen.getByRole("button", { name: "Bloop Excited" }));
    expect(
      screen
        .getByRole("button", { name: "Bloop Excited" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
    expect(screen.getByRole("button", { name: "Play animation" })).toBeTruthy();
  });
  it("imports only an outlined path and rejects unsupported SVG structures", () => {
    expect(
      importSvg(
        '<svg viewBox="0 0 100 100"><path d="M0 0L100 0L50 100Z"/></svg>',
      ),
    ).toMatchObject({ type: "custom", viewBox: [0, 0, 100, 100] });
    expect(() =>
      importSvg(
        '<svg viewBox="0 0 100 100"><script>alert(1)</script><path d="M0 0Z"/></svg>',
      ),
    ).toThrow();
    expect(() =>
      importSvg(
        '<svg viewBox="0 0 100 100"><g transform="scale(2)"><path d="M0 0Z"/></g></svg>',
      ),
    ).toThrow();
  });
  it("keeps malformed saved data available for recovery", async () => {
    localStorage.setItem(storageKey, "{broken");
    render(<CharacterStudio />);
    expect(screen.getByText(/has not been overwritten/)).toBeTruthy();
    expect(localStorage.getItem(storageKey)).toBe("{broken");
  });
});
