import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useMeta } from "../hooks/useMeta";

describe("useMeta", () => {
  it("setea el título del documento con el sufijo PopMart", () => {
    renderHook(() => useMeta({ title: "Play Station 5" }));
    expect(document.title).toBe("Play Station 5 · PopMart");
  });

  it("crea el meta description", () => {
    renderHook(() => useMeta({ title: "X", description: "Una consola" }));
    const meta = document.head.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toBe("Una consola");
  });
});
