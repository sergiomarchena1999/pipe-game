import { describe, it, expect, beforeEach } from 'vitest';
import { WaterFlowManager } from "../../src/core/WaterFlow";
import { Pipe, PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";
import { Grid } from "../../src/core/Grid";


describe('WaterFlowManager.getNextPipeInFlow', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(5, 5, globalThis.mockLogger);
    grid.initialize();
    WaterFlowManager.reset(globalThis.mockLogger);
  });

  describe('Out of bounds scenarios', () => {
    it('should return null when next position is out of bounds (right edge)', () => {
      const cell = grid.getCell(4, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(4, 2, pipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe, Direction.Right, globalThis.mockLogger);

      expect(result).toBeNull();
    });

    it('should return null when next position is out of bounds (left edge)', () => {
      const cell = grid.getCell(0, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(0, 2, pipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe, Direction.Left, globalThis.mockLogger);
      expect(result).toBeNull();
    });

    it('should return null when next position is out of bounds (top edge)', () => {
      const cell = grid.getCell(2, 0);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Up);
      grid.setPipe(2, 0, pipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe, Direction.Up, globalThis.mockLogger);
      expect(result).toBeNull();
    });

    it('should return null when next position is out of bounds (bottom edge)', () => {
      const cell = grid.getCell(2, 4);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Down);
      grid.setPipe(2, 4, pipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe, Direction.Down, globalThis.mockLogger);
      expect(result).toBeNull();
    });
  });

  describe('No pipe scenarios', () => {
    it('should return null when there is no pipe at next position', () => {
      const cell = grid.getCell(2, 2);
      const pipe = new Pipe(PipeType.Straight, cell, Direction.Right);
      grid.setPipe(2, 2, pipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe, Direction.Right, globalThis.mockLogger);
      expect(result).toBeNull();
    });
  });

  describe('Invalid connection scenarios', () => {
    it('should return null when next pipe does not accept water from entry direction', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Up);
      grid.setPipe(3, 2, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Right, globalThis.mockLogger);
      expect(result).toBeNull();
    });

    it('should return null when next pipe has no valid exit', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Start, cell2, Direction.Right);
      grid.setPipe(3, 2, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Right, globalThis.mockLogger);
      expect(result).toBeNull();
    });
  });

  describe('Straight pipe flow', () => {
    it('should correctly flow through horizontal straight pipe', () => {
      const cell1 = grid.getCell(2, 2);
      const cell2 = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cell1, Direction.Right);
      grid.setPipe(2, 2, pipe1);

      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Right);
      grid.setPipe(3, 2, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Right, globalThis.mockLogger);

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

      const pipe2 = new Pipe(PipeType.Straight, cell2, Direction.Up);
      grid.setPipe(2, 3, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Down, globalThis.mockLogger);

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

      const pipe2 = new Pipe(PipeType.Corner, cell2, Direction.Left);
      grid.setPipe(3, 2, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Right, globalThis.mockLogger);

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

      const pipe2 = new Pipe(PipeType.Corner, cell2, Direction.Up);
      grid.setPipe(2, 3, pipe2);

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe1, Direction.Down, globalThis.mockLogger);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(pipe2);
      expect(result!.entryDirection).toBe(Direction.Up);
      expect(result!.exitDirection).toBe(Direction.Left);
    });
  });

  describe('Cross pipe flow', () => {
    it('should flow correctly through cross pipes from all directions', () => {
      const directions = [
        { from: Direction.Right, entry: Direction.Left,  exit: Direction.Right, x: 3, y: 2 },
        { from: Direction.Left,  entry: Direction.Right, exit: Direction.Left,  x: 1, y: 2 },
        { from: Direction.Up,    entry: Direction.Down,  exit: Direction.Up,    x: 2, y: 1 },
        { from: Direction.Down,  entry: Direction.Up,    exit: Direction.Down,  x: 2, y: 3 },
      ];

      directions.forEach((dir) => {
        const cellFrom = grid.getCell(2, 2);
        const cellTo   = grid.getCell(dir.x, dir.y);

        const fromPipe = new Pipe(PipeType.Straight, cellFrom, dir.from);
        grid.setPipe(cellFrom.x, cellFrom.y, fromPipe);

        const crossPipe = new Pipe(PipeType.Cross, cellTo, Direction.Up);
        grid.setPipe(cellTo.x, cellTo.y, crossPipe);

        WaterFlowManager.reset(globalThis.mockLogger);

        const result = WaterFlowManager.getNextPipeInFlow(grid, fromPipe, dir.from, globalThis.mockLogger);

        expect(result).not.toBeNull();
        expect(result!.pipe).toBe(crossPipe);
        expect(result!.entryDirection).toBe(dir.entry);
        expect(result!.exitDirection).not.toBe(dir.from.opposite);
      });
    });

    it('should avoid reusing the same exit direction for a Cross pipe', () => {
      const cellFrom1 = grid.getCell(1, 2);
      const cellFrom2 = grid.getCell(2, 2);
      const cellCross = grid.getCell(3, 2);

      const pipe1 = new Pipe(PipeType.Straight, cellFrom1, Direction.Right);
      grid.setPipe(cellFrom1.x, cellFrom1.y, pipe1);

      const pipe2 = new Pipe(PipeType.Straight, cellFrom2, Direction.Right);
      grid.setPipe(cellFrom2.x, cellFrom2.y, pipe2);

      const crossPipe = new Pipe(PipeType.Cross, cellCross, Direction.Up);
      grid.setPipe(cellCross.x, cellCross.y, crossPipe);

      WaterFlowManager.reset(globalThis.mockLogger);

      const usedExit = Direction.Down;
      WaterFlowManager['visitedCrossConnections'].set(crossPipe, new Map([[Direction.Left, usedExit]]));

      const result = WaterFlowManager.getNextPipeInFlow(grid, pipe2, Direction.Right, globalThis.mockLogger);

      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(crossPipe);
      expect(result!.entryDirection).toBe(Direction.Left);
      expect(result!.exitDirection).not.toBe(usedExit);
    });
  });
});