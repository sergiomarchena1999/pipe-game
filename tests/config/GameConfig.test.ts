import { describe, it, expect } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";
import { PipeType } from "../../src/core/constants/PipeShapes";


describe("GameConfig", () => {
  it("should be fully frozen", () => {
    expect(Object.isFrozen(GameConfig)).toBe(true);
    expect(Object.isFrozen(GameConfig.grid)).toBe(true);
    expect(Object.isFrozen(GameConfig.canvas)).toBe(true);
    expect(Object.isFrozen(GameConfig.pipeWeights)).toBe(true);
  });

  it("grid settings should be positive", () => {
    expect(GameConfig.grid.width).toBeGreaterThan(0);
    expect(GameConfig.grid.height).toBeGreaterThan(0);
    expect(GameConfig.grid.cellSize).toBeGreaterThan(0);
  });

  it("canvas settings should be valid", () => {
    expect(GameConfig.canvas.width).toBeGreaterThan(0);
    expect(GameConfig.canvas.height).toBeGreaterThan(0);
    expect(GameConfig.canvas.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("pipeWeights should be valid", () => {
    let totalWeight = 0;
    for (const [type, weight] of Object.entries(GameConfig.pipeWeights)) {
      if (type === PipeType.Start) continue;
      expect(weight).toBeGreaterThan(0);
      expect(Number.isFinite(weight)).toBe(true);
      totalWeight += weight;
    }
    expect(totalWeight).toBeGreaterThan(0);
  });

  it("queueSize, flowStartDelaySeconds and pipeFlowSpeed should be positive", () => {
    expect(GameConfig.queueSize).toBeGreaterThan(0);
    expect(GameConfig.flowStartDelaySeconds).toBeGreaterThanOrEqual(0);
    expect(GameConfig.pipeFlowSpeed).toBeGreaterThanOrEqual(0);
  });

  it("should not allow modification of GameConfig properties", () => {
    expect(() => ((GameConfig as any).queueSize = 10)).toThrow();
    expect(() => ((GameConfig.grid as any).width = 20)).toThrow();
    expect(() => ((GameConfig.canvas as any).backgroundColor = "#ffffff")).toThrow();
    expect(() => ((GameConfig.pipeWeights as any)[PipeType.Straight] = 0.5)).toThrow();
  });

  it("background color should be a valid hex code", () => {
    const color = GameConfig.canvas.backgroundColor;
    expect(/^#[0-9A-F]{6}$/i.test(color)).toBe(true);
  });
});