import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { GameState } from "../../src/core/GameState";
import { PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";
import { PipeQueue } from "../../src/core/PipeQueue";
import { GameConfig } from "../../src/config/GameConfig";

describe("GameState.placeNextPipe()", () => {
  let state: GameState;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic pipe selection
    state = new GameState(GameConfig, globalThis.mockLogger);
    state.start();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function findFirstEmptyCell(): { x: number; y: number } {
    const { width, height } = GameConfig.grid;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (state.grid.isCellEmpty(x, y)) {
          return { x, y };
        }
      }
    }
    throw new Error("No empty cell found in test grid");
  }

  it("should place a pipe on a valid empty cell", () => {
    const { x, y } = findFirstEmptyCell();
    const pipe = state.placeNextPipe(x, y);

    expect(pipe).not.toBeNull();
    expect(Object.values(PipeType)).toContain(pipe!.type);
    expect(Direction.All).toContain(pipe!.direction);

    const cellPipe = state.grid.getPipeAt(x, y);
    expect(cellPipe).toBe(pipe);

    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      expect.stringMatching(/Placed pipe/)
    );
  });

  it("should not place a pipe on an occupied cell", () => {
    const { x, y } = findFirstEmptyCell();
    const p1 = state.placeNextPipe(x, y);
    expect(p1).not.toBeNull();

    const p2 = state.placeNextPipe(x, y);
    expect(p2).toBeNull();

    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/non-empty cell/)
    );
  });

  it("should not place a pipe out of bounds", () => {
    const pipe = state.placeNextPipe(-1, 999);
    expect(pipe).toBeNull();

    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/out of bounds/)
    );
  });

  it("should warn and return null if GameState not initialized", () => {
    const s = new GameState(GameConfig, globalThis.mockLogger);
    const result = s.placeNextPipe(0, 0);
    expect(result).toBeNull();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "GameState not initialized. Ignoring placeNextPipe."
    );
  });

  it("should log and handle queue errors gracefully", () => {
    vi.spyOn((state as any)._queue as PipeQueue, "dequeue").mockImplementation(() => {
      throw new Error("queue error");
    });

    const { x, y } = findFirstEmptyCell();
    const pipe = state.placeNextPipe(x, y);
    expect(pipe).toBeNull();

    expect(globalThis.mockLogger.error).toHaveBeenCalledWith(
      "Failed to place next pipe",
      expect.any(Error)
    );
  });

  it("should dequeue exactly once per successful placement", () => {
    const spy = vi.spyOn((state as any)._queue as PipeQueue, "dequeue");

    const { x, y } = findFirstEmptyCell();
    state.placeNextPipe(x, y);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not dequeue on invalid placement", () => {
    const spy = vi.spyOn((state as any)._queue as PipeQueue, "dequeue");

    const coords = findFirstEmptyCell();
    state.placeNextPipe(coords.x, coords.y);
    state.placeNextPipe(coords.x, coords.y);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should integrate grid and queue correctly", () => {
    const { x, y } = findFirstEmptyCell();
    const queueBefore = ((state as any)._queue as PipeQueue).contents.slice();
    const spy = vi.spyOn((state as any)._queue as PipeQueue, "dequeue");

    state.placeNextPipe(x, y);

    const queueAfter = ((state as any)._queue as PipeQueue).contents;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(queueAfter.length).toBe(queueBefore.length);
  });
});