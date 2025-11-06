import { describe, it, beforeEach, expect, vi } from "vitest";
import { GameState } from "../../src/core/GameState";
import { PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";
import { PipeQueue } from "../../src/core/PipeQueue";


describe("GameState.placeNextPipe()", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState(3, 3, globalThis.mockLogger as any);
    state.start();
  });

  function findFirstEmptyCell(): { x: number; y: number } {
    // grid is 3x3 in these tests; scan for first empty cell
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (state.grid.isCellEmpty(x, y)) {
          return { x, y };
        }
      }
    }
    // If no empty cell found (extremely unlikely in our setup), fail loudly
    throw new Error("No empty cell found in test grid");
  }

  it("should place a pipe on a valid empty cell", () => {
    const { x, y } = findFirstEmptyCell();
    const pipe = state.placeNextPipe(x, y);

    expect(pipe).not.toBeNull();
    expect(Object.values(PipeType)).toContain(pipe!.type);
    expect(Direction.All).toContain(pipe!.direction);

    // Check grid state
    const cellPipe = state.grid.getPipeAt(x, y);
    expect(cellPipe).toBe(pipe);

    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      expect.stringMatching(/Placed pipe/)
    );
  });

  it("should not place a pipe on an occupied cell", () => {
    const { x, y } = findFirstEmptyCell();
    // Place first pipe
    const p1 = state.placeNextPipe(x, y);
    expect(p1).not.toBeNull();

    // Attempt to place again on the same cell
    const p2 = state.placeNextPipe(x, y);
    expect(p2).toBeNull();

    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/non-empty cell/)
    );
  });

  it("should not place a pipe out of bounds", () => {
    const pipe = state.placeNextPipe(-1, 5);
    expect(pipe).toBeNull();

    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/out of bounds/)
    );
  });

  it("should warn and return null if GameState not initialized", () => {
    const s = new GameState(2, 2, globalThis.mockLogger);
    const result = s.placeNextPipe(0, 0);
    expect(result).toBeNull();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "GameState not initialized. Ignoring placeNextPipe."
    );
  });

  it("should log and handle queue errors gracefully", () => {
    // Force queue.dequeue to throw
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

    const { x, y } = findFirstEmptyCell(); // ensure placement is attempted on an empty cell
    state.placeNextPipe(x, y);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not dequeue on invalid placement", () => {
    const spy = vi.spyOn((state as any)._queue as PipeQueue, "dequeue");

    const coords = findFirstEmptyCell();
    // occupy a cell first
    state.placeNextPipe(coords.x, coords.y);
    // attempt again on the same occupied cell
    state.placeNextPipe(coords.x, coords.y);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should integrate grid and queue correctly (behavioral, non-flaky)", () => {
    const { x, y } = findFirstEmptyCell();
    const queueBefore = ((state as any)._queue as PipeQueue).contents.slice();
    const spy = vi.spyOn((state as any)._queue as PipeQueue, "dequeue");

    state.placeNextPipe(x, y);

    const queueAfter = ((state as any)._queue as PipeQueue).contents;

    // First item should have been removed (dequeue called) and a new one added (length same).
    expect(spy).toHaveBeenCalledTimes(1);
    expect(queueAfter.length).toBe(queueBefore.length);
  });
});