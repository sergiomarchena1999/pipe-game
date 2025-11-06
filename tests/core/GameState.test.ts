import { describe, it, beforeEach, expect, vi } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";
import { GameState } from "../../src/core/GameState";


describe("GameState", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState(GameConfig, globalThis.mockLogger);
  });

  it("should start and initialize grid", () => {
    state.start();
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("GameState started successfully");
    expect(state.grid).toBeDefined();
  });

  it("should not throw if accessed before start", () => {
    const s = new GameState(GameConfig, globalThis.mockLogger);
    expect(() => s.grid).not.toThrow();
  });

  it("should emit stopped event and log", () => {
    const listener = vi.fn();
    state.start();
    state.on("stopped", listener);
    state.stop();
    expect(listener).toHaveBeenCalled();
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("GameState stopped");
  });

  it("should handle double stop gracefully", () => {
    state.stop();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith("GameState not initialized. Nothing to stop.");
  });
});