import { describe, it, expect } from "vitest";
import { PipeShapes } from "../../src/core/constants/PipeShapes";
import { Direction } from "../../src/core/Direction";
import { PipeBase } from "../../src/core/PipeBase";


describe("PipeBase", () => {
  class TestPipe extends PipeBase {}

  it("should store shape and direction", () => {
    const pipe = new TestPipe(PipeShapes.straight, Direction.Up);
    expect(pipe.shape).toBe(PipeShapes.straight);
    expect(pipe.direction).toBe(Direction.Up);
  });

  it("should return correct assetKey", () => {
    const pipe = new TestPipe(PipeShapes.corner, Direction.Right);
    expect(pipe.assetKey).toBe("pipe-corner");
  });

  it("should return readable string from toString()", () => {
    const pipe = new TestPipe(PipeShapes.cross, Direction.Left);
    expect(pipe.toString()).toBe("cross(left)");
  });
});