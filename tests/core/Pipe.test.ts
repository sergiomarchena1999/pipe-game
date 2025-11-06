import { describe, it, expect } from "vitest";
import { Pipe, PipeType, Direction } from "../../src/core/Pipe";
import { GridCell } from "../../src/core/GridCell";

describe("Pipe", () => {
  const cell = new GridCell(0, 0);

  it("should normalize rotation", () => {
    const pipe = new Pipe(PipeType.Straight, cell, 450);
    expect(pipe.rotation).toBe(90);
  });

  it("should return correct asset key", () => {
    expect(new Pipe(PipeType.Curve, cell).assetKey).toBe("pipe-corner");
  });

  it("should rotate connections correctly", () => {
    const pipe = new Pipe(PipeType.Curve, cell, 90);
    const dirs = pipe.getConnections();
    expect(dirs).toContain(Direction.Right);
    expect(dirs).toContain(Direction.Down);
  });

  it("toString() should include type and rotation", () => {
    const pipe = new Pipe(PipeType.Cross, cell, 180);
    expect(pipe.toString()).toMatch(/pipe-cross.*180/);
  });
});