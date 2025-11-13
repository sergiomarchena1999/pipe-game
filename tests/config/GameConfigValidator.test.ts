import { describe, it, expect } from "vitest";
import { DifficultyConfig, Difficulty } from "../../src/config/DifficultyConfig";
import { GameConfigValidator } from "../../src/config/GameConfigValidator";
import { PipeType } from "../../src/core/constants/PipeShapes";
import type { IGameConfig, PipeWeights } from "../../src/config/GameConfig";


describe("GameConfigValidator", () => {
  const validConfig: IGameConfig = {
    difficulty: Difficulty.Easy,
    grid: {
      width: 6,
      height: 6,
      cellSize: 64,
      blockedPercentage: 10,
      allowStartPipeOnEdge: false,
    },
    queue: {
      maxSize: 5,
      pipeWeights: {
        [PipeType.Start]: 0,
        [PipeType.Straight]: 0.4,
        [PipeType.Corner]: 0.4,
        [PipeType.Cross]: 0.2,
      },
    },
    bombConfig: {
      bombTimerSeconds: 1,
      maxBombs: 3,
    },
    flowStartDelaySeconds: 5,
    pipeFlowSpeed: 10,
  };

  it("returns no errors for valid configuration", () => {
    const errors = GameConfigValidator.validate(validConfig);
    expect(errors).toHaveLength(0);
    expect(GameConfigValidator.isValid(validConfig)).toBe(true);
  });

  it("detects invalid grid dimensions", () => {
    const invalid = { ...validConfig, grid: { ...validConfig.grid, width: 0 } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_grid_dimensions")).toBe(true);
  });

  it("detects too-small grid when start pipe allowed on edge", () => {
    const invalid = { ...validConfig, grid: { ...validConfig.grid, width: 2, height: 2, allowStartPipeOnEdge: true } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "grid_too_small")).toBe(true);
  });

  it("detects invalid cell size", () => {
    const invalid = { ...validConfig, grid: { ...validConfig.grid, cellSize: 0 } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_cell_size")).toBe(true);
  });

  it("detects invalid blocked percentage", () => {
    const invalid = { ...validConfig, grid: { ...validConfig.grid, blockedPercentage: 200 } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_blocked_percentage")).toBe(true);
  });

  it("detects invalid queue size", () => {
    const invalid = { ...validConfig, queue: { ...validConfig.queue, maxSize: 0 } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_queue_size")).toBe(true);
  });

  it("detects invalid bomb timer and max bombs", () => {
    const invalid = { ...validConfig, bombConfig: { bombTimerSeconds: 0, maxBombs: 0 } };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_bomb_timer")).toBe(true);
    expect(errors.some(e => e.type === "invalid_max_bombs")).toBe(true);
  });

  it("detects invalid pipe weights", () => {
    const invalid: IGameConfig = {
        ...validConfig,
        queue: {
            ...validConfig.queue,
            pipeWeights: {
            [PipeType.Start]: 1,
            [PipeType.Straight]: 0,
            [PipeType.Corner]: 0,
            [PipeType.Cross]: 0,
            } as unknown as PipeWeights,
        }
    };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_pipe_weights")).toBe(true);
  });

  it("detects invalid flow speed", () => {
    const invalid = { ...validConfig, pipeFlowSpeed: 0 };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_flow_speed")).toBe(true);
  });

  it("detects negative flow delay", () => {
    const invalid = { ...validConfig, flowStartDelaySeconds: -5 };
    const errors = GameConfigValidator.validate(invalid);
    expect(errors.some(e => e.type === "invalid_flow_delay")).toBe(true);
  });
});

describe("DifficultyConfig", () => {
  it("returns valid configs for all difficulties", () => {
    for (const diff of [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard]) {
      const result = DifficultyConfig.getConfig(diff);
      expect(result.success).toBe(true);
      if (!result.success) continue; 
      expect(result.value?.difficulty).toBe(diff);
    }
  });

  it("fails validation when manually corrupting preset", () => {
    // Temporarily patch validator to simulate failure
    const result = DifficultyConfig.getConfig(Difficulty.Easy);
    expect(result.success).toBe(true);

    if (!result.success) return;
    const bad = result.value;
    const broken = { ...bad, grid: { ...bad.grid, width: 0 } };
    const errors = GameConfigValidator.validate(broken);
    expect(errors.length).toBeGreaterThan(0);
  });
});