import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";
import { GameState } from "../../src/core/GameState";
import { Direction } from "../../src/core/Direction";
import { PipeType } from "../../src/core/constants/PipeShapes";
import { Pipe } from "../../src/core/Pipe";


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

  /** Helper: find the first empty cell on the grid */
  function findFirstEmptyCell(): { cell: ReturnType<typeof state.grid.getCell> } {
    const { width, height } = GameConfig.grid;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = state.grid.tryGetCell(x, y);
        if (cell && state.grid.isCellEmpty(cell)) { // pass the GridCell itself
          return { cell };
        }
      }
    }
    throw new Error("No empty cell found in test grid");
  }

  it("should place a pipe on a valid empty cell", () => {
    const { cell } = findFirstEmptyCell();
    const pipe = state.placeNextPipe(cell.x, cell.y);

    expect(pipe).not.toBeNull();
    expect(Object.values(PipeType)).toContain(pipe!.shape.id);
    expect(Direction.All).toContain(pipe!.direction);
    expect(cell.pipe).toBe(pipe);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      expect.stringMatching(/Placed pipe/)
    );
  });

  it("should not place a pipe on an occupied cell", () => {
    const { cell } = findFirstEmptyCell();
    state.placeNextPipe(cell.x, cell.y);

    const secondPipe = state.placeNextPipe(cell.x, cell.y);
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

    const { cell } = findFirstEmptyCell();
    const pipe = state.placeNextPipe(cell.x, cell.y);
    expect(pipe).toBeNull();
    expect(globalThis.mockLogger.error).toHaveBeenCalledWith(
      "Failed to place next pipe",
      expect.any(Error)
    );
  });

  it("should dequeue exactly once per successful placement", () => {
    const spy = vi.spyOn((state as any)._queue, "dequeue");
    const { cell } = findFirstEmptyCell();
    state.placeNextPipe(cell.x, cell.y);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not dequeue on invalid placement", () => {
    const spy = vi.spyOn((state as any)._queue, "dequeue");
    const { cell } = findFirstEmptyCell();

    state.placeNextPipe(cell.x, cell.y); // valid
    state.placeNextPipe(cell.x, cell.y); // invalid
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should integrate grid and queue correctly", () => {
    const { cell } = findFirstEmptyCell();
    const queueBefore = ((state as any)._queue).contents.slice();
    const spy = vi.spyOn((state as any)._queue, "dequeue");

    state.placeNextPipe(cell.x, cell.y);

    const queueAfter = ((state as any)._queue).contents;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(queueAfter.length).toBe(queueBefore.length);
  });

  it("should place multiple pipes sequentially and update grid correctly", () => {
    const placedPipes: Array<{ pipe: Pipe; cell: ReturnType<typeof state.grid.getCell> }> = [];
    for (let i = 0; i < 3; i++) {
      const { cell } = findFirstEmptyCell();
      const pipe = state.placeNextPipe(cell.x, cell.y);
      expect(pipe).not.toBeNull();
      placedPipes.push({ pipe: pipe!, cell });
    }

    placedPipes.forEach(({ pipe, cell }) => {
      expect(cell.pipe).toBe(pipe);
    });
  });

  it("should place the first pipe in the queue deterministically", () => {
    const { cell } = findFirstEmptyCell();
    const nextPipe = (state as any)._queue.contents[0];
    const placedPipe = state.placeNextPipe(cell.x, cell.y);

    expect(placedPipe).not.toBeNull();
    expect(placedPipe!.direction).toBe(nextPipe.direction);
    expect(placedPipe!.shape).toBe(nextPipe.shape);
  });
});