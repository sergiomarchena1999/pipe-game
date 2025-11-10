import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";
import { GameState } from "../../src/core/GameState";
import { Direction } from "../../src/core/Direction";
import { PipeType } from "../../src/core/constants/PipeShapes";


describe("GameState.placeNextPipe()", () => {
  let state: GameState;

  beforeEach(() => {
    // deterministic pipe selection
    vi.spyOn(Math, "random").mockReturnValue(0);
    state = new GameState(GameConfig, globalThis.mockLogger);
    state.start();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Helper: find the first empty cell on the grid */
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
    expect(Object.values(PipeType)).toContain(pipe!.shape.id);
    expect(Direction.All).toContain(pipe!.direction);
    expect(state.grid.getPipeAt(x, y)).toBe(pipe);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      expect.stringMatching(/Placed pipe/)
    );
  });

  it("should not place a pipe on an occupied cell", () => {
    const { x, y } = findFirstEmptyCell();
    state.placeNextPipe(x, y);

    const secondPipe = state.placeNextPipe(x, y);
    expect(secondPipe).toBeNull();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Cannot place pipe/)
    );
  });

  it("should not place a pipe out of bounds", () => {
    const pipe = state.placeNextPipe(-1, 999);
    expect(pipe).toBeNull();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Cannot place pipe/)
    );
  });

  it("should warn and return null if GameState not initialized", () => {
    const uninit = new GameState(GameConfig, globalThis.mockLogger);
    const result = uninit.placeNextPipe(0, 0);
    expect(result).toBeNull();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "GameState not initialized. Ignoring placeNextPipe."
    );
  });

  it("should handle queue errors gracefully", () => {
    vi.spyOn((state as any)._queue, "dequeue").mockImplementation(() => {
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
    const spy = vi.spyOn((state as any)._queue, "dequeue");
    const { x, y } = findFirstEmptyCell();
    state.placeNextPipe(x, y);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not dequeue on invalid placement", () => {
    const spy = vi.spyOn((state as any)._queue, "dequeue");
    const coords = findFirstEmptyCell();

    state.placeNextPipe(coords.x, coords.y); // valid
    state.placeNextPipe(coords.x, coords.y); // invalid
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should integrate grid and queue correctly", () => {
    const { x, y } = findFirstEmptyCell();
    const queueBefore = ((state as any)._queue).contents.slice();
    const spy = vi.spyOn((state as any)._queue, "dequeue");

    state.placeNextPipe(x, y);

    const queueAfter = ((state as any)._queue).contents;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(queueAfter.length).toBe(queueBefore.length);
  });

  it("should place multiple pipes sequentially and update grid correctly", () => {
    const placedPipes = [];
    for (let i = 0; i < 3; i++) {
      const { x, y } = findFirstEmptyCell();
      const pipe = state.placeNextPipe(x, y);
      expect(pipe).not.toBeNull();
      placedPipes.push({ pipe, x, y });
    }

    placedPipes.forEach(({ pipe, x, y }) => {
      expect(state.grid.getPipeAt(x, y)).toBe(pipe);
    });
  });

  it("should place the first pipe in the queue deterministically", () => {
    const { x, y } = findFirstEmptyCell();
    const nextPipe = (state as any)._queue.contents[0];
    const placedPipe = state.placeNextPipe(x, y);

    expect(placedPipe).not.toBeNull();
    expect(placedPipe!.direction).toBe(nextPipe.direction);
    expect(placedPipe!.shape).toBe(nextPipe.shape);
  });

  it("should call debugSummary and log the current queue", () => {
    const spy = vi.spyOn(globalThis.mockLogger, "debug");
    const { x, y } = findFirstEmptyCell();

    state.placeNextPipe(x, y);
    state.debugSummary();

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/Pipe Queue: \[/)
    );
  });
});