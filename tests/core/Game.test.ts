import { describe, it, expect, beforeEach } from "vitest";
import { Game } from "../../src/core/Game";
import { initializeMock, destroyMock } from "../setup";

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(globalThis.mockLogger);
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
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "Game already running. Ignoring start request."
    );
  });
});