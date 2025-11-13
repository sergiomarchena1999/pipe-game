import { describe, it, expect } from "vitest";
import { PipeShapes, PipeType } from "../../../../src/core/constants/PipeShapes";
import { Direction } from "../../../../src/core/domain/Direction";
import { PipeBase } from "../../../../src/core/domain/pipe/PipeBase";


describe('PipeBase', () => {
  it('should store shape and direction', () => {
    const shape = PipeShapes[PipeType.Straight];
    const pipe = new PipeBase(shape, Direction.Up);
    
    expect(pipe.shape).toBe(shape);
    expect(pipe.direction).toBe(Direction.Up);
  });

  it('should generate correct asset key', () => {
    const pipe = new PipeBase(PipeShapes[PipeType.Corner], Direction.Right);
    expect(pipe.assetKey).toBe('pipe-corner');
  });

  it('should have readable toString', () => {
    const pipe = new PipeBase(PipeShapes[PipeType.Cross], Direction.Down);
    expect(pipe.toString()).toContain('cross');
    expect(pipe.toString()).toContain('down');
  });
});