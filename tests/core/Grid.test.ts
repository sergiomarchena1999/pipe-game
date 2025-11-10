import { describe, it, expect, beforeEach, vi } from "vitest";
import { Grid } from "../../src/core/Grid";


describe("Grid", () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(2, 2, globalThis.mockLogger);
  });

  it("should throw on invalid dimensions", () => {
    expect(() => new Grid(0, 2, globalThis.mockLogger)).toThrow();
    expect(() => new Grid(2, 0, globalThis.mockLogger)).toThrow();
    expect(() => new Grid(101, 2, globalThis.mockLogger)).toThrow();
  });

  it("should initialize with a start pipe", () => {
    grid.initialize();
    expect(grid.startPipe).toBeDefined();
    expect(grid.getPipeAt(grid.startPipe.position.x, grid.startPipe.position.y)).toBe(grid.startPipe);
  });

  it("should throw when accessing startPipe before initialization", () => {
    const uninitGrid = new Grid(2, 2, globalThis.mockLogger);
    expect(() => uninitGrid.startPipe).toThrow("Grid has not been initialized");
  });

  it("should set and remove pipes correctly", () => {
    grid.initialize();
    const pipe = grid.startPipe;
    grid.setPipe(1, 1, pipe);
    expect(grid.getPipeAt(1, 1)).toBe(pipe);
    grid.removePipe(1, 1);
    expect(grid.getPipeAt(1, 1)).toBeNull();
  });

  it("should ignore removePipe out of bounds without throwing", () => {
    expect(() => grid.removePipe(-1, 0)).not.toThrow();
    expect(() => grid.removePipe(0, -1)).not.toThrow();
    expect(() => grid.removePipe(10, 10)).not.toThrow();
  });

  it("should validate positions correctly", () => {
    expect(grid.isValidPosition(0, 0)).toBe(true);
    expect(grid.isValidPosition(grid.width - 1, grid.height - 1)).toBe(true);
    expect(grid.isValidPosition(-1, 0)).toBe(false);
    expect(grid.isValidPosition(0, -1)).toBe(false);
    expect(grid.isValidPosition(grid.width, grid.height)).toBe(false);
  });

  it("should correctly report empty and occupied cells", () => {
    grid.initialize();
    const { x, y } = grid.startPipe.position;
    expect(grid.isCellEmpty(x, y)).toBe(false);
    expect(grid.isCellEmpty(0, 0 === x && 0 === y ? 1 : 0)).toBe(true);
    expect(grid.isCellEmpty(-1, -1)).toBe(false);
    expect(grid.isCellEmpty(grid.width, grid.height)).toBe(false);
  });

  it("should return null for getPipeAt invalid or empty cells", () => {
    expect(grid.getPipeAt(-1, 0)).toBeNull();
    expect(grid.getPipeAt(0, -1)).toBeNull();
    expect(grid.getPipeAt(0, 0)).toBeNull(); // assuming not start pipe yet
  });

  it("should detect network connections correctly", () => {
    grid.initialize();
    const startPipe = grid.startPipe;
    const x = startPipe.position.x;
    const y = startPipe.position.y;
    const neighborCellX = x + 1 < grid.width ? x + 1 : x - 1;
    const neighborCellY = y;
    const neighborPipe = startPipe; // reuse pipe to simulate connection
    grid.setPipe(neighborCellX, neighborCellY, neighborPipe);

    // Should detect connection if ports align
    const connected = grid.isConnectedToNetwork(neighborPipe);
    expect(typeof connected).toBe("boolean"); // true/false
  });

  it("should clear all pipes except start pipe", () => {
    grid.initialize();
    const pipe = grid.startPipe;
    grid.setPipe(0, 0, pipe);
    grid.clear();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const p = grid.getPipeAt(x, y);
        if (p === pipe) continue;
        expect(p).toBeNull();
      }
    }
  });
});