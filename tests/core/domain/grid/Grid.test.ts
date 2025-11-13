import { describe, it, expect, beforeEach } from "vitest";
import { PipeShapes, PipeType } from "../../../../src/core/constants/PipeShapes";
import { createMockLogger } from "../../../fixtures/LoggerFixtures";
import { GridPosition } from "../../../../src/core/domain/grid/GridPosition";
import { IGridConfig } from "../../../../src/config/GameConfig";
import { Direction } from "../../../../src/core/domain/Direction";
import { ILogger } from "../../../../src/core/logging/ILogger";
import { Grid } from "../../../../src/core/domain/grid/Grid";
import { Pipe } from "../../../../src/core/domain/pipe/Pipe";


describe('Grid', () => {
  let logger: ILogger;
  let config: IGridConfig;

  beforeEach(() => {
    logger = createMockLogger();
    config = {
      width: 10,
      height: 8,
      cellSize: 32,
      blockedPercentage: 0,
      allowStartPipeOnEdge: false,
    };
  });

  describe('construction', () => {
    it('should create grid with correct dimensions', () => {
      const grid = new Grid(config, logger);
      expect(grid.dimensions.width).toBe(10);
      expect(grid.dimensions.height).toBe(8);
    });

    it('should not be initialized on construction', () => {
      const grid = new Grid(config, logger);
      expect(grid.isInitialized).toBe(false);
    });

    it('should create all cells', () => {
      const grid = new Grid(config, logger);
      const stats = grid.getStats();
      expect(stats.totalCells).toBe(80); // 10 * 8
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', () => {
      const grid = new Grid(config, logger);
      const result = grid.initialize();
      
      expect(result.success).toBe(true);
      expect(grid.isInitialized).toBe(true);
    });

    it('should create start pipe', () => {
      const grid = new Grid(config, logger);
      grid.initialize();
      
      const startPipe = grid.tryGetStartPipe();
      expect(startPipe).not.toBeNull();
      expect(startPipe?.shape.id).toBe(PipeType.Start);
    });

    it('should fail if already initialized', () => {
      const grid = new Grid(config, logger);
      grid.initialize();
      const result = grid.initialize();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('already_initialized');
      }
    });

    it('should block cells according to percentage', () => {
      const blockedConfig: IGridConfig = {
        ...config,
        blockedPercentage: 25,
      };
      const grid = new Grid(blockedConfig, logger);
      grid.initialize();
      
      const stats = grid.getStats();
      expect(stats.blockedCells).toBeGreaterThan(0);
      expect(stats.blockedCells).toBeLessThanOrEqual(20); // ~25% of 80
    });

    it('should place start pipe away from edges when configured', () => {
      const edgeConfig: IGridConfig = {
        ...config,
        allowStartPipeOnEdge: false,
      };
      const grid = new Grid(edgeConfig, logger);
      grid.initialize();
      
      const startPipe = grid.startPipe;
      expect(startPipe.position.x).toBeGreaterThan(0);
      expect(startPipe.position.x).toBeLessThan(9);
      expect(startPipe.position.y).toBeGreaterThan(0);
      expect(startPipe.position.y).toBeLessThan(7);
    });
  });

  describe('cell access', () => {
    let grid: Grid;

    beforeEach(() => {
      grid = new Grid(config, logger);
      grid.initialize();
    });

    it('should get cell at valid position', () => {
      const pos = GridPosition.createUnsafe(5, 3);
      const cell = grid.getCell(pos);
      expect(cell.position.equals(pos)).toBe(true);
    });

    it('should throw for out of bounds position', () => {
      const pos = GridPosition.create(20, 20, 30, 30)!; // Valid in larger grid
      expect(() => grid.getCell(pos)).toThrow(/out of bounds/);
    });

    it('should return null for invalid position with tryGetCell', () => {
      const pos = GridPosition.create(20, 20, 30, 30)!;
      expect(grid.tryGetCell(pos)).toBeNull();
    });

    it('should get valid neighbors', () => {
      const pos = GridPosition.createUnsafe(5, 5);
      const up = grid.getNeighbor(pos, Direction.Up);
      
      expect(up).not.toBeNull();
      expect(up?.position.y).toBe(4);
    });

    it('should return null for out-of-bounds neighbor', () => {
      const pos = GridPosition.createUnsafe(0, 0);
      const up = grid.getNeighbor(pos, Direction.Up);
      expect(up).toBeNull();
    });

    it('should return null for blocked neighbor with getValidNeighbor', () => {
      const pos = GridPosition.createUnsafe(5, 5);
      const neighborPos = pos.move(Direction.Up, 10, 8)!;
      const neighborCell = grid.getCell(neighborPos);
      neighborCell.block();
      
      const validNeighbor = grid.getValidNeighbor(pos, Direction.Up);
      expect(validNeighbor).toBeNull();
    });
  });

  describe('pipe operations', () => {
    let grid: Grid;
    let position: GridPosition;
    let pipe: Pipe;

    beforeEach(() => {
      grid = new Grid(config, logger);
      grid.initialize();
      position = GridPosition.createUnsafe(5, 5);
      pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
    });

    it('should set pipe successfully', () => {
      const cell = grid.getCell(position);
      const result = grid.setPipe(cell, pipe);
      
      expect(result.success).toBe(true);
      expect(cell.pipe).toBe(pipe);
    });

    it('should fail to set pipe on blocked cell', () => {
      const cell = grid.getCell(position);
      cell.block();
      const result = grid.setPipe(cell, pipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('cell_blocked');
      }
    });

    it('should fail with position mismatch', () => {
      const wrongPos = GridPosition.createUnsafe(0, 0);
      const wrongPipe = new Pipe(wrongPos, PipeShapes[PipeType.Straight], Direction.Right);
      const cell = grid.getCell(position);
      const result = grid.setPipe(cell, wrongPipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('position_mismatch');
      }
    });

    it('should remove pipe', () => {
      const cell = grid.getCell(position);
      grid.setPipe(cell, pipe);
      grid.removePipe(cell);
      
      expect(cell.isEmpty).toBe(true);
    });

    it('should not throw when removing from empty cell', () => {
      const cell = grid.getCell(position);
      expect(() => grid.removePipe(cell)).not.toThrow();
    });

    it('should block cell', () => {
      const cell = grid.getCell(position);
      grid.blockCell(cell);
      expect(cell.isBlocked).toBe(true);
    });
  });

  describe('network analysis', () => {
    let grid: Grid;

    beforeEach(() => {
      grid = new Grid(config, logger);
      grid.initialize();
    });

    it('should detect connected pipes', () => {
      const pos1 = GridPosition.createUnsafe(5, 5);
      const pos2 = GridPosition.createUnsafe(6, 5);
      
      const pipe1 = new Pipe(pos1, PipeShapes[PipeType.Straight], Direction.Right);
      const pipe2 = new Pipe(pos2, PipeShapes[PipeType.Straight], Direction.Right);
      
      grid.setPipe(grid.getCell(pos1), pipe1);
      grid.setPipe(grid.getCell(pos2), pipe2);
      
      expect(grid.isConnectedToNetwork(pipe1)).toBe(true);
      expect(grid.getConnectedNeighbors(pipe1)).toContain(pipe2);
    });

    it('should not detect incompatible neighbors', () => {
      const pos1 = GridPosition.createUnsafe(5, 5);
      const pos2 = GridPosition.createUnsafe(6, 5);
      
      // Both facing up - won't connect horizontally
      const pipe1 = new Pipe(pos1, PipeShapes[PipeType.Straight], Direction.Up);
      const pipe2 = new Pipe(pos2, PipeShapes[PipeType.Straight], Direction.Up);
      
      grid.setPipe(grid.getCell(pos1), pipe1);
      grid.setPipe(grid.getCell(pos2), pipe2);
      
      expect(grid.getConnectedNeighbors(pipe1)).not.toContain(pipe2);
    });

    it('should get pipe at position', () => {
      const pos = GridPosition.createUnsafe(5, 5);
      const pipe = new Pipe(pos, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(pos), pipe);
      
      expect(grid.getPipeAt(pos)).toBe(pipe);
    });
  });

  describe('grid management', () => {
    let grid: Grid;

    beforeEach(() => {
      grid = new Grid(config, logger);
      grid.initialize();
    });

    it('should clear all pipes except start', () => {
      const pos = GridPosition.createUnsafe(5, 5);
      const pipe = new Pipe(pos, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(pos), pipe);
      
      grid.clear();
      
      expect(grid.getPipeAt(pos)).toBeNull();
      expect(grid.tryGetStartPipe()).not.toBeNull();
    });

    it('should reset grid completely', () => {
      grid.reset();
      
      expect(grid.isInitialized).toBe(false);
      expect(grid.tryGetStartPipe()).toBeNull();
    });

    it('should iterate over all cells', () => {
      const cells: any[] = [];
      grid.forEachCell(cell => cells.push(cell));
      expect(cells).toHaveLength(80);
    });

    it('should find cells by predicate', () => {
      const emptyCells = grid.findCells(cell => cell.isEmpty);
      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('should get empty cells', () => {
      const empty = grid.getEmptyCells();
      expect(empty.length).toBeGreaterThan(0);
    });

    it('should get cells with pipes', () => {
      const withPipes = grid.getCellsWithPipes();
      expect(withPipes.length).toBeGreaterThanOrEqual(1); // At least start pipe
    });
  });

  describe('statistics', () => {
    it('should report correct stats', () => {
      const grid = new Grid(config, logger);
      grid.initialize();
      
      const stats = grid.getStats();
      expect(stats.totalCells).toBe(80);
      expect(stats.isInitialized).toBe(true);
      expect(stats.pipesPlaced).toBeGreaterThanOrEqual(1); // Start pipe
      expect(stats.emptyCells + stats.blockedCells + stats.pipesPlaced).toBe(80);
    });
  });
});