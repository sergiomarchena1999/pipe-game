import { describe, it, expect, beforeEach } from "vitest";
import { PipeShapes, PipeType } from "../../../../src/core/constants/PipeShapes";
import { GridPosition } from "../../../../src/core/domain/grid/GridPosition";
import { Direction } from "../../../../src/core/domain/Direction";
import { GridCell } from "../../../../src/core/domain/grid/GridCell";
import { Pipe } from "../../../../src/core/domain/pipe/Pipe";


describe('GridCell', () => {
  let cell: GridCell;
  let position: GridPosition;
  let pipe: Pipe;

  beforeEach(() => {
    position = GridPosition.createUnsafe(5, 3);
    cell = new GridCell(position);
    pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
  });

  describe('initial state', () => {
    it('should start empty and unblocked', () => {
      expect(cell.isEmpty).toBe(true);
      expect(cell.hasPipe).toBe(false);
      expect(cell.isBlocked).toBe(false);
      expect(cell.pipe).toBeNull();
    });

    it('should have correct position', () => {
      expect(cell.position).toBe(position);
    });
  });

  describe('setPipe', () => {
    it('should place pipe successfully', () => {
      cell.setPipe(pipe);
      expect(cell.hasPipe).toBe(true);
      expect(cell.isEmpty).toBe(false);
      expect(cell.pipe).toBe(pipe);
    });

    it('should throw when placing on blocked cell', () => {
      cell.block();
      expect(() => cell.setPipe(pipe)).toThrow(/blocked/);
    });

    it('should throw when cell already has pipe', () => {
      cell.setPipe(pipe);
      const pipe2 = new Pipe(position, PipeShapes[PipeType.Corner], Direction.Up);
      expect(() => cell.setPipe(pipe2)).toThrow(/already contains/);
    });

    it('should throw when pipe position does not match', () => {
      const wrongPos = GridPosition.createUnsafe(0, 0);
      const wrongPipe = new Pipe(wrongPos, PipeShapes[PipeType.Straight], Direction.Right);
      expect(() => cell.setPipe(wrongPipe)).toThrow(/does not match/);
    });
  });

  describe('clearPipe', () => {
    it('should remove pipe', () => {
      cell.setPipe(pipe);
      cell.clearPipe();
      expect(cell.isEmpty).toBe(true);
      expect(cell.hasPipe).toBe(false);
      expect(cell.pipe).toBeNull();
    });

    it('should not throw when clearing empty cell', () => {
      expect(() => cell.clearPipe()).not.toThrow();
    });
  });

  describe('block/unblock', () => {
    it('should block cell and clear pipe', () => {
      cell.setPipe(pipe);
      cell.block();
      expect(cell.isBlocked).toBe(true);
      expect(cell.pipe).toBeNull();
    });

    it('should unblock cell', () => {
      cell.block();
      cell.unblock();
      expect(cell.isBlocked).toBe(false);
    });
  });
});