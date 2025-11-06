import { describe, it, expect } from "vitest";
import { Pipe, PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";
import { GridCell } from "../../src/core/GridCell";


describe("Pipe", () => {
  const cell = new GridCell(0, 0);

  it("should return correct asset key", () => {
    expect(new Pipe(PipeType.Curve, cell, Direction.Left).assetKey).toBe("pipe-corner");
  });

  it("should rotate connections correctly", () => {
    const pipe = new Pipe(PipeType.Curve, cell, Direction.Right);
    const dirs = pipe.getConnections();
    expect(dirs).toContain(Direction.Right);
    expect(dirs).toContain(Direction.Down);
  });

  it("toString() should include type and direction", () => {
    const pipe = new Pipe(PipeType.Cross, cell, Direction.Down);
    expect(pipe.toString()).toMatch(/pipe-cross.(down)/);
  });
});