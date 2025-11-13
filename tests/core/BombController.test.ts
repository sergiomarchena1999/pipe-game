import { beforeEach, describe, expect, it, vi } from "vitest";
import { IBombConfig, IGridConfig, IQueueConfig } from "../../src/config/GameConfig";
import { PipeShapes, PipeType } from "../../src/core/constants/PipeShapes";
import { createMockLogger } from "../fixtures/LoggerFixtures";
import { BombController } from "../../src/core/BombController";
import { GridPosition } from "../../src/core/domain/grid/GridPosition";
import { PipeQueue } from "../../src/core/domain/pipe/PipeQueue";
import { Direction } from "../../src/core/domain/Direction";
import { ILogger } from "../../src/core/logging/ILogger";
import { Grid } from "../../src/core/domain/grid/Grid";
import { Pipe } from "../../src/core/domain/pipe/Pipe";


describe('BombController', () => {
  let grid: Grid;
  let queue: PipeQueue;
  let bombController: BombController;
  let logger: ILogger;
  let config: IBombConfig;
  let events: any;

  beforeEach(() => {
    logger = createMockLogger();
    
    const gridConfig: IGridConfig = {
      width: 10,
      height: 8,
      cellSize: 32,
      blockedPercentage: 0,
      allowStartPipeOnEdge: false,
    };
    
    const queueConfig: IQueueConfig = {
      maxSize: 3,
      pipeWeights: {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 10,
        [PipeType.Cross]: 5,
        [PipeType.Start]: 0,
      },
    };
    
    config = {
      maxBombs: 2,
      bombTimerSeconds: 2,
    };
    
    events = {
      onBombStarted: vi.fn(),
      onBombCompleted: vi.fn(),
      onBombCancelled: vi.fn(),
    };
    
    grid = new Grid(gridConfig, logger);
    grid.initialize();
    queue = new PipeQueue(logger, queueConfig);
    bombController = new BombController(grid, queue, logger, config, events);
  });

  describe('startBomb', () => {
    let targetPipe: Pipe;
    let position: GridPosition;

    beforeEach(() => {
      position = GridPosition.createUnsafe(5, 5);
      targetPipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(position), targetPipe);
    });

    it('should start bomb successfully', () => {
      const result = bombController.startBomb(targetPipe, 0);
      
      expect(result.success).toBe(true);
      expect(targetPipe.isBombing).toBe(true);
      expect(events.onBombStarted).toHaveBeenCalledWith(position, 2000);
    });

    it('should fail if max bombs reached', () => {
      const pos2 = GridPosition.createUnsafe(6, 5);
      const pipe2 = new Pipe(pos2, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(pos2), pipe2);
      
      bombController.startBomb(targetPipe, 0);
      bombController.startBomb(pipe2, 0);
      
      const pos3 = GridPosition.createUnsafe(7, 5);
      const pipe3 = new Pipe(pos3, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(pos3), pipe3);
      
      const result = bombController.startBomb(pipe3, 0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('max_bombs_reached');
      }
    });

    it('should fail for start pipe', () => {
      const result = bombController.startBomb(grid.startPipe, 0);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('cannot_bomb_start_pipe');
      }
    });

    it('should fail if pipe is blocked', () => {
      targetPipe.markPortUsed(Direction.Left);
      const result = bombController.startBomb(targetPipe, 0);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('pipe_blocked');
      }
    });
  });

  describe('update', () => {
    let targetPipe: Pipe;

    beforeEach(() => {
      const position = GridPosition.createUnsafe(5, 5);
      targetPipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(position), targetPipe);
    });

    it('should complete bomb after timer expires', () => {
      bombController.startBomb(targetPipe, 0);
      
      bombController.update(2.5); // Past the 2 second timer
      
      expect(events.onBombCompleted).toHaveBeenCalled();
      expect(targetPipe.isBombing).toBe(false);
    });

    it('should not complete bomb before timer expires', () => {
      bombController.startBomb(targetPipe, 0);
      
      bombController.update(1); // Only 1 second
      
      expect(events.onBombCompleted).not.toHaveBeenCalled();
      expect(targetPipe.isBombing).toBe(true);
    });

    it('should replace pipe with queued pipe on completion', () => {
      const queuedPipe = queue.peek();
      bombController.startBomb(targetPipe, 0);
      
      bombController.update(2.5);
      
      const newPipe = grid.getPipeAt(targetPipe.position);
      expect(newPipe).not.toBe(targetPipe);
      expect(newPipe?.shape).toBe(queuedPipe?.shape);
    });

    it('should handle multiple bombs completing simultaneously', () => {
      const pos2 = GridPosition.createUnsafe(6, 5);
      const pipe2 = new Pipe(pos2, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(pos2), pipe2);
      
      bombController.startBomb(targetPipe, 0);
      bombController.startBomb(pipe2, 0);
      
      bombController.update(2.5);
      
      expect(events.onBombCompleted).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelAll', () => {
    it('should cancel all active bombs', () => {
      const position = GridPosition.createUnsafe(5, 5);
      const pipe = new Pipe(position, PipeShapes[PipeType.Straight], Direction.Right);
      grid.setPipe(grid.getCell(position), pipe);
      
      bombController.startBomb(pipe, 0);
      bombController.cancelAll();
      
      expect(pipe.isBombing).toBe(false);
    });

    it('should handle cancelling when no bombs active', () => {
      expect(() => bombController.cancelAll()).not.toThrow();
    });
  });
});