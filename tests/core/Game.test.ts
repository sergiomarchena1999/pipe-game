import { describe, it, expect, beforeEach } from "vitest";
import { initializeMock, destroyMock } from "../setup";
import { Game } from "../../src/core/Game";


describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(globalThis.mockLogger);
  });

  it("should start the game and call engine.initialize", async () => {
    await game.start();
    expect(initializeMock).toHaveBeenCalled();
    expect(game.running).toBe(true);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("Game started successfully");
  });

  it("should stop the game and call engine.destroy", async () => {
    await game.start();
    game.stop();
    expect(destroyMock).toHaveBeenCalled();
    expect(game.running).toBe(false);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("Game stopped successfully");
  });

  it("should warn if start is called while already running", async () => {
    await game.start();
    await game.start();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "Game already running. Ignoring start request."
    );
  });

  it("should warn if stop is called when not running", () => {
    game.stop();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "Game not running. Ignoring stop request."
    );
  });

  it("should propagate errors during start", async () => {
    initializeMock.mockRejectedValueOnce(new Error("init fail"));

    await expect(game.start()).rejects.toThrow("init fail");
    expect(globalThis.mockLogger.error).toHaveBeenCalledWith(
      "Failed to start game",
      expect.any(Error)
    );
    expect(game.running).toBe(false);
  });

  it("should propagate errors during stop", async () => {
    await game.start();
    destroyMock.mockImplementationOnce(() => { throw new Error("destroy fail"); });

    expect(() => game.stop()).toThrow("destroy fail");
    expect(globalThis.mockLogger.error).toHaveBeenCalledWith(
      "Error during game shutdown",
      expect.any(Error)
    );
    expect(game.running).toBe(true);
  });

  it("start/stop should be idempotent", async () => {
    await game.start();
    await game.start(); // second start should not re-call initialize
    expect(initializeMock).toHaveBeenCalledTimes(1);

    game.stop();
    game.stop(); // second stop should not re-call destroy
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});