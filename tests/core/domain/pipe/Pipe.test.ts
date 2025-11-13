import { describe, it, expect, beforeEach } from "vitest";
import { PipeShapes, PipeType } from "../../../../src/core/constants/PipeShapes";
import { GridPosition } from "../../../../src/core/domain/grid/GridPosition";
import { Direction } from "../../../../src/core/domain/Direction";
import { Pipe } from "../../../../src/core/domain/pipe/Pipe";


describe('Pipe', () => {
  let position: GridPosition;

  beforeEach(() => {
    position = GridPosition.createUnsafe(5, 3);
  });

  describe('construction and rotation', () => {
    it('should create pipe with correct properties', () => {
      const pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
      expect(pipe.position).toBe(position);
      expect(pipe.shape).toBe(PipeShapes[PipeType.Straight]);
      expect(pipe.direction).toBe(Direction.Right);
    });

    it('should rotate straight pipe connections correctly', () => {
      // Straight pipe default: Left-Right
      const rightPipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
      expect(rightPipe.openPorts).toContain(Direction.Left);
      expect(rightPipe.openPorts).toContain(Direction.Right);

      // Rotated 90° (Down): should be Up-Down
      const downPipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Down);
      expect(downPipe.openPorts).toContain(Direction.Up);
      expect(downPipe.openPorts).toContain(Direction.Down);
    });

    it('should rotate corner pipe connections correctly', () => {
      // Corner default: Up-Right
      const rightCorner = new Pipe(position, PipeShapes[PipeType.Corner], Direction.Right);
      expect(rightCorner.openPorts).toContain(Direction.Up);
      expect(rightCorner.openPorts).toContain(Direction.Right);

      // Rotated 90° (Down): should be Right-Down
      const downCorner = new Pipe(position, PipeShapes[PipeType.Corner], Direction.Down);
      expect(downCorner.openPorts).toContain(Direction.Right);
      expect(downCorner.openPorts).toContain(Direction.Down);
    });

    it('should handle cross pipe (all directions)', () => {
      const cross = new Pipe(position, PipeShapes[PipeType.Cross], Direction.Up);
      expect(cross.openPorts).toHaveLength(4);
      expect(cross.openPorts).toContain(Direction.Up);
      expect(cross.openPorts).toContain(Direction.Down);
      expect(cross.openPorts).toContain(Direction.Left);
      expect(cross.openPorts).toContain(Direction.Right);
    });
  });

  describe('port management', () => {
    let pipe: Pipe;

    beforeEach(() => {
      pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
    });

    it('should start with all ports open', () => {
      expect(pipe.openPorts).toHaveLength(2);
      expect(pipe.usedPorts).toHaveLength(0);
      expect(pipe.isBlocked).toBe(false);
    });

    it('should accept water from valid directions', () => {
      expect(pipe.accepts(Direction.Left)).toBe(true);
      expect(pipe.accepts(Direction.Right)).toBe(true);
      expect(pipe.accepts(Direction.Up)).toBe(false);
      expect(pipe.accepts(Direction.Down)).toBe(false);
    });

    it('should check for open ports correctly', () => {
      expect(pipe.hasOpenPort(Direction.Left)).toBe(true);
      pipe.markPortUsed(Direction.Left);
      expect(pipe.hasOpenPort(Direction.Left)).toBe(false);
    });

    it('should mark ports as used', () => {
      pipe.markPortUsed(Direction.Left);
      expect(pipe.usedPorts).toContain(Direction.Left);
      expect(pipe.openPorts).not.toContain(Direction.Left);
      expect(pipe.isBlocked).toBe(true);
    });

    it('should throw when marking non-existent port', () => {
      expect(() => pipe.markPortUsed(Direction.Up)).toThrow(/non-existent port/);
    });

    it('should allow marking already used port', () => {
      pipe.markPortUsed(Direction.Left);
      expect(() => pipe.markPortUsed(Direction.Left)).not.toThrow();
    });
  });

  describe('bomb animation', () => {
    let pipe: Pipe;

    beforeEach(() => {
      pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
    });

    it('should start not bombing', () => {
      expect(pipe.isBombing).toBe(false);
      expect(pipe.getBombProgress(0, 1)).toBe(0);
    });

    it('should track bomb animation state', () => {
      pipe.startBombAnimation(100);
      expect(pipe.isBombing).toBe(true);
      expect(pipe.isBlocked).toBe(true);
    });

    it('should calculate bomb progress correctly', () => {
      const startTime = 100;
      const duration = 2; // seconds
      
      pipe.startBombAnimation(startTime);
      
      expect(pipe.getBombProgress(startTime, duration)).toBe(0);
      expect(pipe.getBombProgress(startTime + 1, duration)).toBe(0.5);
      expect(pipe.getBombProgress(startTime + 2, duration)).toBe(1);
      expect(pipe.getBombProgress(startTime + 3, duration)).toBe(1); // clamped
    });

    it('should reset bomb state', () => {
      pipe.startBombAnimation(100);
      pipe.resetBombState();
      expect(pipe.isBombing).toBe(false);
      expect(pipe.getBombProgress(200, 1)).toBe(0);
    });
  });
});