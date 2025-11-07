import { describe, it, expect, beforeEach } from 'vitest';
import { Grid } from "../../src/core/Grid";
import { Pipe, PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";


describe('Grid.getNextPipeInFlow', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(5, 5, globalThis.mockLogger);
    grid.initialize();
  });

  describe('Out of bounds scenarios', () => {
    it('should return null when next position is out of bounds (right edge)', () => {
      const cell = grid.getCell(4, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(4, 2, pipe);

      const result = grid.getNextPipeInFlow(4, 2, Direction.Right);

      expect(result).toBeNull();
      expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('out of bounds')
      );
    });

    it('should return null when next position is out of bounds (left edge)', () => {
      const cell = grid.getCell(0, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(0, 2, pipe);

      const result = grid.getNextPipeInFlow(0, 2, Direction.Left);
      expect(result).toBeNull();
    });

    it('should return null when next position is out of bounds (top edge)', () => {
      const cell = grid.getCell(2, 0);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Up);
      grid.setPipe(2, 0, pipe);

      const result = grid.getNextPipeInFlow(2, 0, Direction.Up);
      expect(result).toBeNull();
    });

    it('should return null when next position is out of bounds (bottom edge)', () => {
      const cell = grid.getCell(2, 4);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Down);
      grid.setPipe(2, 4, pipe);

      const result = grid.getNextPipeInFlow(2, 4, Direction.Down);
      expect(result).toBeNull();
    });
  });

  describe('No pipe scenarios', () => {
    it('should return null when there is no pipe at next position', () => {
      const cell = grid.getCell(2, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(2, 2, pipe);
      // Position (3, 2) is empty

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);
      expect(result).toBeNull();
      expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('no pipe at')
      );
    });
  });

  describe('Invalid connection scenarios', () => {
    it('should return null when next pipe does not accept water from entry direction', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      // Pipe at (2,2) exits Right
      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      // Pipe at (3,2) accepts from Up/Down only (Straight facing Up)
      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Up);
      grid.setPipe(3, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);
      expect(result).toBeNull();
      expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("doesn't accept water from")
      );
    });

    it('should return null when next pipe has no valid exit', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      // Start pipe only has one connection (output), no valid exit when water enters
      const pipe2 = new Pipe(PipeType.Start, cell2, Direction.Right);
      grid.setPipe(3, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);
      expect(result).toBeNull();
    });
  });

  describe('Straight pipe flow', () => {
    it('should correctly flow through horizontal straight pipe', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      // Horizontal straight pipe at (3,2)
      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Right);
      grid.setPipe(3, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Left);
      expect(result!.exitDirection).toBe(Direction.Right);
    });

    it('should correctly flow through vertical straight pipe', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(2, 3);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Down);
      grid.setPipe(2, 2, pipe1);

      // Vertical straight pipe at (2,3)
      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Up);
      grid.setPipe(2, 3, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Down);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Up);
      expect(result!.exitDirection).toBe(Direction.Down);
    });
  });

  describe('Corner pipe flow', () => {
    it('should correctly flow through corner pipe (right to down)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      // Corner pipe: Up-Right base, rotated to face Down (so it's Left-Down)
      const pipe2 = new Pipe(PipeType.Corner, cell2, Direction.Left);
      grid.setPipe(3, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Left);
      expect(result!.exitDirection).toBe(Direction.Down);
    });

    it('should correctly flow through corner pipe (down to left)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(2, 3);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Down);
      grid.setPipe(2, 2, pipe1);

      // Corner pipe: rotated to accept from Down and exit Left
      const pipe2 = new Pipe(PipeType.Corner, cell2, Direction.Up);
      grid.setPipe(2, 3, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Down);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Up);
      expect(result!.exitDirection).toBe(Direction.Left);
    });
  });

  describe('Cross pipe flow', () => {
    it('should flow straight through cross pipe (right to left)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      // Cross pipe accepts from all directions
      const pipe2 = new Pipe(PipeType.Cross, cell2, Direction.Up);
      grid.setPipe(3, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Right);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Left);
      expect(result!.exitDirection).toBe(Direction.Right);
    });

    it('should flow straight through cross pipe (up to down)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(2, 1);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Up);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Cross, cell2, Direction.Up);
      grid.setPipe(2, 1, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Up);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Down);
      expect(result!.exitDirection).toBe(Direction.Up);
    });

    it('should flow straight through cross pipe (down to up)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(2, 3);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Down);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Cross, cell2, Direction.Up);
      grid.setPipe(2, 3, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Down);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Up);
      expect(result!.exitDirection).toBe(Direction.Down);
    });

    it('should flow straight through cross pipe (left to right)', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(1, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Left);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Cross, cell2, Direction.Up);
      grid.setPipe(1, 2, pipe2);

      const result = grid.getNextPipeInFlow(2, 2, Direction.Left);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Right);
      expect(result!.exitDirection).toBe(Direction.Left);
    });
  });

  describe('Complex flow chains', () => {
    it('should correctly chain multiple pipes together', () => {
      // Create a simple path: Straight -> Corner -> Straight
      const cell1 = grid.getCell(1, 2);
      const cell2 = grid.getCell(2, 2);
      const cell3 = grid.getCell(2, 3);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(1, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Corner, cell2, Direction.Left);
      grid.setPipe(2, 2, pipe2);

      const pipe3 = new Pipe(PipeType.Straight, cell3, Direction.Up);
      grid.setPipe(2, 3, pipe3);

      // First transition
      const result1 = grid.getNextPipeInFlow(1, 2, Direction.Right);
      expect(result1).not.toBeNull();
      expect(result1!.pipe).toBe(pipe2);
      expect(result1!.exitDirection).toBe(Direction.Down);

      // Second transition
      const result2 = grid.getNextPipeInFlow(2, 2, Direction.Down);
      expect(result2).not.toBeNull();
      expect(result2!.pipe).toBe(pipe3);
      expect(result2!.exitDirection).toBe(Direction.Down);
    });
  });

  describe('Start pipe integration', () => {
    it('should work correctly from initialized start pipe', () => {
      const startPipe = grid.startPipe;
      const startConnections = startPipe.getConnections();
      const startExit = startConnections[0];

      const nextX = startPipe.position.x + startExit.dx;
      const nextY = startPipe.position.y + startExit.dy;

      // Place a compatible pipe at next position
      const nextCell = grid.getCell(nextX, nextY);
      const nextPipe = new Pipe(PipeType.Straight, nextCell, startExit);
      grid.setPipe(nextX, nextY, nextPipe);

      const result = grid.getNextPipeInFlow(
        startPipe.position.x,
        startPipe.position.y,
        startExit
      );

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(nextPipe);
    });
  });
});