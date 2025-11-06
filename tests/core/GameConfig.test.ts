import { describe, it, expect } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";

describe("GameConfig", () => {
  it("should be frozen and valid", () => {
    expect(Object.isFrozen(GameConfig)).toBe(true);
    expect(GameConfig.grid.width).toBeGreaterThan(0);
    expect(GameConfig.grid.height).toBeGreaterThan(0);
    expect(GameConfig.canvas.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
  });
});