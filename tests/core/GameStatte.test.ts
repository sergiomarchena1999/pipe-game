import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameState } from "../../src/core/GameState";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("GameState", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState(2, 2, mockLogger as any);
    vi.clearAllMocks();
  });

  it("should start and initialize grid", () => {
    state.start();
    expect(mockLogger.info).toHaveBeenCalledWith("GameState started successfully");
    expect(state.grid).toBeDefined();
  });

  it("should throw if accessed before start", () => {
    const s = new GameState(2, 2, mockLogger as any);
    expect(() => s.grid).toThrow();
  });

  it("should emit stopped event and log", () => {
    const listener = vi.fn();
    state.start();
    state.on("stopped", listener);
    state.stop();
    expect(listener).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith("GameState stopped");
  });

  it("should handle double stop gracefully", () => {
    state.stop();
    expect(mockLogger.warn).toHaveBeenCalledWith("GameState not initialized. Nothing to stop.");
  });
});
