import { describe, it, expect, beforeEach } from "vitest";
import { WaterFlowManager } from "../../src/core/WaterFlow";
import { Pipe, PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";
import { Grid } from "../../src/core/Grid";


describe("WaterFlowManager", () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(5, 5, globalThis.mockLogger);
    WaterFlowManager.reset(globalThis.mockLogger);
  });

  it("should initialize flow from the start pipe", () => {
    const startCell = grid.getCell(0, 0);
    const start = new Pipe(PipeType.Start, startCell, Direction.Right);

    (grid as any)._startPipe = start;
    grid.setPipe(0, 0, start);

    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.count).toBe(1);
    expect(WaterFlowManager.last).toBe(start);
  });

  it("should advance through a straight line", () => {
    const c0 = grid.getCell(0, 0);
    const c1 = grid.getCell(1, 0);
    const c2 = grid.getCell(2, 0);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const p1 = new Pipe(PipeType.Straight, c1, Direction.Right);
    const p2 = new Pipe(PipeType.Straight, c2, Direction.Right);

    (grid as any)._startPipe = start;
    grid.setPipe(c0.x, c0.y, start);
    grid.setPipe(c1.x, c1.y, p1);
    grid.setPipe(c2.x, c2.y, p2);

    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);
    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);

    expect(WaterFlowManager.count).toBe(3);
    expect(WaterFlowManager.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Straight,
      PipeType.Straight,
    ]);
  });

  it("should stop if there is no next connected pipe", () => {
    const startCell = grid.getCell(0, 0);
    const start = new Pipe(PipeType.Start, startCell, Direction.Right);

    (grid as any)._startPipe = start;
    grid.setPipe(0, 0, start);

    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(false);
    expect(WaterFlowManager.count).toBe(1);
  });

  it("should correctly turn with a corner pipe", () => {
    const c0 = grid.getCell(0, 0);
    const c1 = grid.getCell(1, 0);
    const c2 = grid.getCell(1, 1);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const corner = new Pipe(PipeType.Corner, c1, Direction.Left); // Entry Left → Exit Down
    const end = new Pipe(PipeType.Straight, c2, Direction.Down);

    (grid as any)._startPipe = start;
    grid.setPipe(c0.x, c0.y, start);
    grid.setPipe(c1.x, c1.y, corner);
    grid.setPipe(c2.x, c2.y, end);

    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);
    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);

    expect(WaterFlowManager.count).toBe(3);
    expect(WaterFlowManager.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Corner,
      PipeType.Straight,
    ]);
  });

  it("should not advance if the next pipe does not physically connect", () => {
    const c0 = grid.getCell(0, 0);
    const c1 = grid.getCell(0, 1);

    const start = new Pipe(PipeType.Start, c0, Direction.Right);
    const wrong = new Pipe(PipeType.Corner, c1, Direction.Right); // Does not connect from Left

    (grid as any)._startPipe = start;
    grid.setPipe(0, 0, start);
    grid.setPipe(1, 0, wrong);

    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(false);
    expect(WaterFlowManager.count).toBe(1);
  });

  it("should throw error if initialized without a start pipe", () => {
    (grid as any)._startPipe = undefined;
    expect(() => WaterFlowManager.initialize(grid, globalThis.mockLogger)).toThrow();
  });
});

describe("WaterFlowManager Cross pipes", () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(5, 5, globalThis.mockLogger);
    WaterFlowManager.reset(globalThis.mockLogger);
  });

  const crossTestCases = [
    { from: Direction.Right, entry: Direction.Left, x: 1, y: 2 },
    { from: Direction.Left,  entry: Direction.Right, x: 3, y: 2 },
    { from: Direction.Up,    entry: Direction.Down, x: 2, y: 1 },
    { from: Direction.Down,  entry: Direction.Up, x: 2, y: 3 },
  ];

  it("should flow correctly through a Cross pipe only if a valid exit exists", () => {
    crossTestCases.forEach(({ from, entry, x, y }) => {
      grid = new Grid(5, 5, globalThis.mockLogger);
      WaterFlowManager.reset(globalThis.mockLogger);
      
      const crossCell = grid.getCell(x, y);
      const startCell = grid.getCell(x - from.dx, y - from.dy);
      const possibleExits = Direction.All.filter(dir => dir !== entry);
      const exitDir = possibleExits[0];
      
      const nextCell = grid.getCell(x + exitDir.dx, y + exitDir.dy);

      const start = new Pipe(PipeType.Straight, startCell, from);
      const cross = new Pipe(PipeType.Cross, crossCell, Direction.Up);
      
      const nextPipeDirection = exitDir.opposite === Direction.Up || exitDir.opposite === Direction.Down
        ? Direction.Up
        : Direction.Left;
      const nextPipe = new Pipe(PipeType.Straight, nextCell, nextPipeDirection);

      grid.setPipe(startCell.x, startCell.y, start);
      grid.setPipe(crossCell.x, crossCell.y, cross);
      grid.setPipe(nextCell.x, nextCell.y, nextPipe);

      const result = WaterFlowManager.getNextPipeInFlow(grid, start, from, globalThis.mockLogger);
      expect(result).not.toBeNull();
      expect(result!.pipe).toBe(cross);
      expect(result!.exitDirection).not.toBe(entry);
      expect(result!.exitDirection).toBe(exitDir);
    });
  });

  it("should avoid reusing the same exit direction for a Cross pipe", () => {
    const crossCell = grid.getCell(2, 2);
    const startCell1 = grid.getCell(1, 2); // flujo Right → Cross
    const startCell2 = grid.getCell(2, 1); // flujo Down → Cross

    const pipe1 = new Pipe(PipeType.Straight, startCell1, Direction.Right);
    const pipe2 = new Pipe(PipeType.Straight, startCell2, Direction.Down);
    const cross = new Pipe(PipeType.Cross, crossCell, Direction.Up);

    grid.setPipe(startCell1.x, startCell1.y, pipe1);
    grid.setPipe(startCell2.x, startCell2.y, pipe2);
    grid.setPipe(crossCell.x, crossCell.y, cross);

    WaterFlowManager.reset(globalThis.mockLogger);
    WaterFlowManager['visitedCrossConnections'].set(cross, new Set([Direction.Right]));

    const result = WaterFlowManager.getNextPipeInFlow(grid, pipe2, Direction.Down, globalThis.mockLogger);

    expect(result).not.toBeNull();
    expect(result!.pipe).toBe(cross);
    expect(result!.exitDirection.name).not.toBe(Direction.Right.name);
  });

  it("should flow through multiple consecutive Cross pipes", () => {
    const startCell = grid.getCell(0, 2);
    const cross1Cell = grid.getCell(1, 2);
    const cross2Cell = grid.getCell(2, 2);
    const endCell = grid.getCell(3, 2);

    const start = new Pipe(PipeType.Start, startCell, Direction.Right);
    const cross1 = new Pipe(PipeType.Cross, cross1Cell, Direction.Left); // entry Left
    const cross2 = new Pipe(PipeType.Cross, cross2Cell, Direction.Left); // entry Left
    const end = new Pipe(PipeType.Straight, endCell, Direction.Right);

    grid.setPipe(startCell.x, startCell.y, start);
    grid.setPipe(cross1Cell.x, cross1Cell.y, cross1);
    grid.setPipe(cross2Cell.x, cross2Cell.y, cross2);
    grid.setPipe(endCell.x, endCell.y, end);

    (grid as any)._startPipe = start;
    WaterFlowManager.reset(globalThis.mockLogger);
    WaterFlowManager.initialize(grid, globalThis.mockLogger);

    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);
    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);
    expect(WaterFlowManager.tryAdvance(grid, globalThis.mockLogger)).toBe(true);

    expect(WaterFlowManager.count).toBe(4);
    expect(WaterFlowManager.pipes.map(p => p.type)).toEqual([
      PipeType.Start,
      PipeType.Cross,
      PipeType.Cross,
      PipeType.Straight,
    ]);
  });
});