import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { FlowNetwork } from "../../src/core/FlowNetwork";
import { GameConfig } from "../../src/config/GameConfig";
import { GameState } from "../../src/core/GameState";


vi.mock("../../src/core/FlowNetwork", () => ({
  FlowNetwork: {
    initialize: vi.fn(),
    update: vi.fn(),
  },
}));

describe("GameState (other methods)", () => {
  let state: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    state = new GameState(GameConfig, globalThis.mockLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start and initialize grid, flow network, and emit initialized event", () => {
    const listener = vi.fn();
    state.on("initialized", listener);

    state.start();

    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("GameState started successfully");
    expect(state.grid).toBeDefined();
    expect(FlowNetwork.initialize).toHaveBeenCalledWith(
      state.grid,
      globalThis.mockLogger,
      GameConfig.flowStartDelaySeconds
    );
    expect(listener).toHaveBeenCalledWith(state.grid);
  });

  it("should throw if start is called twice", () => {
    state.start();
    expect(() => state.start()).toThrow("GameState already initialized");
  });

  it("should update the flow network when update() is called", () => {
    state.start();
    state.update(0.16); // deltaTime in seconds

    expect(FlowNetwork.update).toHaveBeenCalledWith(
      0.16,
      GameConfig.pipeFlowSpeed,
      state.grid,
      globalThis.mockLogger
    );
  });

  it("should stop the game state and emit stopped event", () => {
    const listener = vi.fn();
    state.start();
    state.on("stopped", listener);

    state.stop();

    expect(listener).toHaveBeenCalled();
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("GameState stopped");
  });

  it("should warn if stop is called before start", () => {
    state.stop();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "GameState not initialized. Nothing to stop."
    );
  });

  it("should expose queue and score getters", () => {
    state.start();
    expect(state.queue).toBeDefined();
    expect(state.score).toBeDefined();
  });

  it("should not throw when accessing grid before start", () => {
    const s = new GameState(GameConfig, globalThis.mockLogger);
    expect(() => s.grid).not.toThrow();
    expect(s.grid).toBeDefined();
  });
});