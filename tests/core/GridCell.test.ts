import { describe, it, expect } from "vitest";
import { Direction } from "../../src/core/Direction";
import { GridCell } from "../../src/core/GridCell";


describe("GridCell", () => {
  it("should store and clear a pipe", () => {
    const cell = new GridCell(1, 2);
    expect(cell.isEmpty()).toBe(true);

    const fakePipe = { type: "straight", direction: Direction.Right };
    cell.setPipe(fakePipe as any);
    expect(cell.pipe).toBe(fakePipe);
    expect(cell.isEmpty()).toBe(false);

    cell.clearPipe();
    expect(cell.isEmpty()).toBe(true);
  });

  it("should throw on negative coordinates", () => {
    expect(() => new GridCell(-1, 0)).toThrow();
    expect(() => new GridCell(0, -1)).toThrow();
    expect(() => new GridCell(-1, -1)).toThrow();
  });

  it("toString() should return coordinates", () => {
    const cell = new GridCell(3, 4);
    expect(cell.toString()).toBe("(3, 4)");
  });

  it("setPipe should replace an existing pipe", () => {
    const cell = new GridCell(0, 0);
    const pipe1 = { type: "corner", direction: Direction.Up };
    const pipe2 = { type: "straight", direction: Direction.Right };
    
    cell.setPipe(pipe1 as any);
    expect(cell.pipe).toBe(pipe1);
    
    cell.setPipe(pipe2 as any);
    expect(cell.pipe).toBe(pipe2);
  });
});