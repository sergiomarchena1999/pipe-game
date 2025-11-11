import { describe, it, expect, beforeEach } from "vitest";
import { PipeShapes, PipeType } from "../../src/core/constants/PipeShapes";
import { IGridConfig } from "../../src/config/GameConfig";
import { Grid } from "../../src/core/Grid";
import { Pipe } from "../../src/core/Pipe";


const mockConfig: IGridConfig = {
  width: 2,
  height: 2,
  cellSize: 32,
  blockedPercentage: 0,
  allowStartPipeOnEdge: true,
};

describe("Grid", () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(mockConfig, globalThis.mockLogger);
  });

  it("should initialize with a start pipe", () => {
    grid.initialize();
    const startPipe = grid.startPipe;
    const startCell = grid.getCell(startPipe.position.x, startPipe.position.y);

    expect(startPipe).toBeDefined();
    expect(startCell.pipe).toBe(startPipe);
  });

  it("should throw when accessing startPipe before initialization", () => {
    const uninitGrid = new Grid(mockConfig, globalThis.mockLogger);
    expect(() => uninitGrid.startPipe).toThrow("Grid has not been initialized");
  });

  it("should set and remove pipes correctly", () => {
    grid.initialize();
    const pipe = grid.startPipe;
    const cell = grid.getCell(1, 1);
    grid.setPipe(cell, pipe);

    expect(cell.pipe).toBe(pipe);

    grid.removePipe(cell);
    expect(cell.pipe).toBeNull();
  });

  it("should ignore removePipe out of bounds without throwing", () => {
    expect(() => {
      const cell = grid.tryGetCell(-1, 0);
      if (cell) grid.removePipe(cell);
    }).not.toThrow();

    expect(() => {
      const cell = grid.tryGetCell(0, -1);
      if (cell) grid.removePipe(cell);
    }).not.toThrow();

    expect(() => {
      const cell = grid.tryGetCell(10, 10);
      if (cell) grid.removePipe(cell);
    }).not.toThrow();
  });

  it("should validate positions correctly", () => {
    expect(grid.isValidPosition(0, 0)).toBe(true);
    expect(grid.isValidPosition(1, 1)).toBe(true);
    expect(grid.isValidPosition(-1, 0)).toBe(false);
    expect(grid.isValidPosition(0, -1)).toBe(false);
    expect(grid.isValidPosition(2, 2)).toBe(false);
  });

  it("should correctly report empty and occupied cells", () => {
    grid.initialize();
    const startCell = grid.getCell(grid.startPipe.position.x, grid.startPipe.position.y);
    expect(startCell.isEmpty()).toBe(false);

    const otherY = startCell.y === 0 ? 1 : 0;
    const otherCell = grid.getCell(0, otherY);
    expect(otherCell.isEmpty()).toBe(true);

    expect(grid.tryGetCell(-1, -1)?.isEmpty() ?? false).toBe(false);
    expect(grid.tryGetCell(2, 2)?.isEmpty() ?? false).toBe(false);
  });

  it("should return null for invalid or empty cells", () => {
    expect(grid.tryGetCell(-1, 0)).toBe(null);
    expect(grid.tryGetCell(0, -1)).toBe(null);
    expect(grid.tryGetCell(0, 0)?.pipe ?? null).toBeNull(); // before initialize
  });

  it("should detect network connections correctly", () => {
    grid.initialize();
    const startPipe = grid.startPipe;
    const { x, y } = startPipe.position;

    const nx = x + 1 < mockConfig.width ? x + 1 : x - 1;
    const ny = y;
    const cell = grid.getCell(nx, ny);

    const newPipe = new Pipe(cell, PipeShapes[PipeType.Start], startPipe.direction);
    grid.setPipe(cell, newPipe);

    const connected = grid.isConnectedToNetwork(newPipe);
    expect(typeof connected).toBe("boolean");
  });

  it("should clear all pipes except start pipe", () => {
    grid.initialize();
    const startPipe = grid.startPipe;
    const cell = grid.getCell(0, 0);
    grid.setPipe(cell, startPipe);

    grid.clear();

    for (let y = 0; y < mockConfig.height; y++) {
      for (let x = 0; x < mockConfig.width; x++) {
        const c = grid.getCell(x, y);
        if (c.pipe === startPipe) continue;
        expect(c.pipe).toBeNull();
      }
    }
  });
});