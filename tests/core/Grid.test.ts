import { describe, it, expect } from "vitest";
import { Grid } from "../../src/core/Grid";

describe("Grid", () => {
  it("should initialize with start pipe", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);
    grid.initialize();
    expect(grid.startPipe).toBeDefined();
  });

  it("should throw on invalid dimensions", () => {
    expect(() => new Grid(0, 2, globalThis.mockLogger)).toThrow();
  });

  it("should set and remove pipes correctly", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);
    grid.initialize();
    const pipe = grid.startPipe;
    grid.setPipe(1, 1, pipe);
    expect(grid.getPipeAt(1, 1)).toBe(pipe);
    grid.removePipe(1, 1);
    expect(grid.getPipeAt(1, 1)).toBeNull();
  });

  it("should ignore removePipe out of bounds", () => {
    const grid = new Grid(2, 2, globalThis.mockLogger);
    grid.removePipe(-1, 0);
  });
});