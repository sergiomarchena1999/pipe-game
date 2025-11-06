import { describe, it, expect, vi } from "vitest";
import { Grid } from "../../src/core/Grid";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
};

describe("Grid", () => {
  it("should initialize with start pipe", () => {
    const grid = new Grid(2, 2, mockLogger as any);
    grid.initialize();
    expect(grid.startPipe).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Start pipe created/));
  });

  it("should throw on invalid dimensions", () => {
    expect(() => new Grid(0, 2, mockLogger as any)).toThrow();
  });

  it("should set and remove pipes correctly", () => {
    const grid = new Grid(2, 2, mockLogger as any);
    grid.initialize();
    const pipe = grid.startPipe;
    grid.setPipe(1, 1, pipe);
    expect(grid.getPipeAt(1, 1)).toBe(pipe);
    grid.removePipe(1, 1);
    expect(grid.getPipeAt(1, 1)).toBeNull();
  });

  it("should ignore removePipe out of bounds", () => {
    const grid = new Grid(2, 2, mockLogger as any);
    grid.removePipe(-1, 0); // no error
  });
});