// @vitest-environment jsdom

import { describe, expect, it, vi } from "vite-plus/test";
import { focusActiveSidebarRow, handleSidebarRowKeyDown } from "./Sidebar.logic";

function press(key: string, list: HTMLElement, target: HTMLElement) {
  const preventDefault = vi.fn();
  handleSidebarRowKeyDown({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    target,
    currentTarget: list,
    preventDefault,
  });
  return preventDefault;
}

describe("handleSidebarRowKeyDown", () => {
  it("moves focus to and opens the adjacent row, stopping at the ends", () => {
    const list = document.createElement("div");
    list.innerHTML = `
      <div data-testid="sidebar-draft-row" tabindex="0"></div>
      <div data-testid="sidebar-row-card" tabindex="0"><input /></div>
      <div data-testid="sidebar-row-slim" tabindex="0"></div>`;
    document.body.append(list);
    const [draft, card, slim] = [...list.children] as HTMLElement[];
    const clicks = [draft, card, slim].map((row) => {
      const onClick = vi.fn();
      row!.addEventListener("click", onClick);
      return onClick;
    });

    press("ArrowDown", list, card!);
    expect(document.activeElement).toBe(slim);
    expect(clicks[2]).toHaveBeenCalledOnce();

    press("ArrowUp", list, card!);
    expect(document.activeElement).toBe(draft);
    expect(clicks[0]).toHaveBeenCalledOnce();

    expect(press("ArrowUp", list, draft!)).not.toHaveBeenCalled();
    expect(press("ArrowDown", list, slim!)).not.toHaveBeenCalled();
    // Keys inside nested controls (e.g. rename input) are left alone.
    expect(press("ArrowDown", list, card!.querySelector("input")!)).not.toHaveBeenCalled();
  });

  it("hands focus to the composer on Enter", () => {
    const list = document.createElement("div");
    list.innerHTML = `<div data-testid="sidebar-row-card" tabindex="0"></div>`;
    document.body.append(list);
    const row = list.firstElementChild as HTMLElement;
    row.focus();
    const onFocusComposer = vi.fn();
    window.addEventListener("t3code:focus-composer", onFocusComposer);

    press("Enter", list, row);

    expect(onFocusComposer).toHaveBeenCalledOnce();
    expect(document.activeElement).not.toBe(row);
  });

  it("returns focus to the active row", () => {
    document.body.innerHTML = `
      <div data-testid="sidebar-row-card" tabindex="0"></div>
      <div data-testid="sidebar-row-card" tabindex="0" aria-current="page"></div>`;
    const active = document.body.lastElementChild as HTMLElement;
    // jsdom has no layout, so offsetParent is always null there.
    Object.defineProperty(active, "offsetParent", { get: () => document.body });

    expect(focusActiveSidebarRow()).toBe(true);
    expect(document.activeElement).toBe(active);
  });
});
