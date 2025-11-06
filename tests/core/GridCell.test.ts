import { describe, it, expect } from "vitest";
import { GridCell } from "../../src/core/GridCell";
import { Direction } from "../../src/core/Direction";

describe("GridCell", () => {
  it("should store and clear a pipe", () => {
    const cell = new GridCell(1, 2);
    expect(cell.isEmpty()).toBe(true);

    const fakePipe = { type: "straight", direction: Direction.Right };
    cell.setPipe(fakePipe as any);
    expect(cell.pipe).toBe(fakePipe);

    cell.clearPipe();
    expect(cell.isEmpty()).toBe(true);
  });

  it("should serialize to JSON correctly", () => {
    const cell = new GridCell(0, 0);
    expect(cell.toJSON()).toEqual({ x: 0, y: 0, hasPipe: false });
  });

  it("should throw on negative coordinates", () => {
    expect(() => new GridCell(-1, 0)).toThrow();
  });
});