import { describe, expect, it, vi } from "vitest";
import { createRiskLevelLabels } from "@/domain/riskLabels";

describe("createRiskLevelLabels", () => {
  it("translates registry level keys for every risk level", () => {
    const translate = vi.fn((key: string) => key);

    expect(createRiskLevelLabels(translate)).toEqual({
      low: "risk.level.low",
      moderate: "risk.level.moderate",
      high: "risk.level.high",
      extreme: "risk.level.extreme",
    });
    expect(translate).not.toHaveBeenCalledWith(
      expect.stringContaining("levelShort"),
    );
  });
});
