import { describe, it, expect, vi, beforeEach } from "vitest";
import { Game } from "../../src/core/Game";

const initializeMock = vi.fn().mockResolvedValue(undefined);
const destroyMock = vi.fn();

vi.mock("../../src/engine/phaser/PhaserEngine", () => {
  return {
    PhaserEngine: class {
      initialize = initializeMock;
      destroy = destroyMock;
    },
  };
});

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();
    game = new Game(mockLogger as any);
  });

  it("should start game and call engine.initialize", async () => {
    await game.start();
    expect(initializeMock).toHaveBeenCalled();
    expect(game.running).toBe(true);
  });

  it("should stop game and call engine.destroy", async () => {
    await game.start();
    game.stop();
    expect(destroyMock).toHaveBeenCalled();
    expect(game.running).toBe(false);
  });

  it("should warn if already running", async () => {
    await game.start();
    await game.start();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Game already running. Ignoring start request."
    );
  });
});
