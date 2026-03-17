import { describe, expect, it } from "vitest";
import { getReadableTextColor } from "@/lib/colorContrast";

describe("getReadableTextColor", () => {
  it("selects the higher-contrast text color for the current risk palette", () => {
    expect(getReadableTextColor("#FFE478")).toBe("#000000");
    expect(getReadableTextColor("#F5810C")).toBe("#000000");
    expect(getReadableTextColor("#CF3838")).toBe("#ffffff");
    expect(getReadableTextColor("#8C2439")).toBe("#ffffff");
  });

  it("falls back to the dark text color for unsupported inputs", () => {
    expect(getReadableTextColor("invalid")).toBe("#000000");
  });
});
