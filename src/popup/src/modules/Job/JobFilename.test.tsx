// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobFilename } from "./JobFilename";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
});

function renderWithRoot(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(element);
  });
  const rerender = (next: React.ReactElement) =>
    act(() => {
      root.render(next);
    });
  return { container, rerender };
}

function render(element: React.ReactElement) {
  return renderWithRoot(element).container;
}

function click(container: HTMLElement, label: string) {
  const button = container.querySelector(
    `button[aria-label="${label}"]`,
  ) as HTMLButtonElement;
  act(() => {
    button.click();
  });
}

function nameInput(container: HTMLElement) {
  return container.querySelector(
    'input[aria-label="File name"]',
  ) as HTMLInputElement;
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(
  input: HTMLInputElement,
  key: string,
  init: KeyboardEventInit = {},
) {
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...init }),
    );
  });
}

describe("JobFilename", () => {
  it("edits the name without its extension and submits on Enter", () => {
    const onRename = vi.fn();
    const container = render(
      <JobFilename
        filename="Watch Show Free HD-index.mp4"
        canRename
        onRename={onRename}
      />,
    );

    click(container, "Rename file");
    expect(nameInput(container).value).toBe("Watch Show Free HD-index");

    type(nameInput(container), "Show S01E02");
    press(nameInput(container), "Enter");

    expect(onRename).toHaveBeenCalledWith("Show S01E02");
    expect(nameInput(container)).toBeNull();
  });

  it("discards the edit on Escape", () => {
    const onRename = vi.fn();
    const container = render(
      <JobFilename filename="video.mkv" canRename onRename={onRename} />,
    );

    click(container, "Rename file");
    type(nameInput(container), "something else");
    press(nameInput(container), "Escape");

    expect(onRename).not.toHaveBeenCalled();
    expect(container.textContent).toContain("video.mkv");
  });

  it("does not submit a blank name", () => {
    const onRename = vi.fn();
    const container = render(
      <JobFilename filename="video.mp4" canRename onRename={onRename} />,
    );

    click(container, "Rename file");
    type(nameInput(container), "   ");
    click(container, "Save file name");

    expect(onRename).not.toHaveBeenCalled();
  });

  it("hides the rename button when renaming is not allowed", () => {
    const container = render(
      <JobFilename filename="video.mp4" canRename={false} onRename={vi.fn()} />,
    );

    expect(container.querySelector('button[aria-label="Rename file"]')).toBe(
      null,
    );
  });

  it("keeps the typed name when saving starts mid-edit", () => {
    const onRename = vi.fn();
    const { container, rerender } = renderWithRoot(
      <JobFilename filename="video.mp4" canRename onRename={onRename} />,
    );

    click(container, "Rename file");
    type(nameInput(container), "Episode 4");
    rerender(
      <JobFilename
        filename="video.mp4"
        canRename={false}
        onRename={onRename}
      />,
    );

    press(nameInput(container), "Enter");
    expect(onRename).not.toHaveBeenCalled();
    expect(nameInput(container).value).toBe("Episode 4");
    expect(
      (
        container.querySelector(
          'button[aria-label="Save file name"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    rerender(
      <JobFilename filename="video.mp4" canRename onRename={onRename} />,
    );
    press(nameInput(container), "Enter");
    expect(onRename).toHaveBeenCalledWith("Episode 4");
  });

  it("ignores Enter and Escape while an IME composition is active", () => {
    const onRename = vi.fn();
    const container = render(
      <JobFilename filename="video.mp4" canRename onRename={onRename} />,
    );

    click(container, "Rename file");
    type(nameInput(container), "えいが");
    press(nameInput(container), "Enter", { isComposing: true });
    press(nameInput(container), "Escape", { isComposing: true });
    press(nameInput(container), "Enter", { keyCode: 229 });

    expect(onRename).not.toHaveBeenCalled();
    expect(nameInput(container).value).toBe("えいが");

    press(nameInput(container), "Enter");
    expect(onRename).toHaveBeenCalledWith("えいが");
  });
});
