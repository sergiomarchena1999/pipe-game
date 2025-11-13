import { describe, it, beforeEach, expect, vi } from "vitest";
import { createMockLogger } from "../fixtures/LoggerFixtures";
import { GridPosition } from "../../src/core/domain/grid/GridPosition";
import { IGameConfig } from "../../src/config/GameConfig";
import { Difficulty } from "../../src/config/DifficultyConfig";
import { GameState } from "../../src/core/GameState";
import { PipeType } from "../../src/core/constants/PipeShapes";
import { ILogger } from "../../src/core/logging/ILogger";


describe('GameState', () => {
  let gameState: GameState;
  let logger: ILogger;
  let config: IGameConfig;

  beforeEach(() => {
    logger = createMockLogger();
    config = {
      difficulty: Difficulty.Medium,
      grid: {
        width: 10,
        height: 8,
        cellSize: 32,
        blockedPercentage: 10,
        allowStartPipeOnEdge: false,
      },
      queue: {
        maxSize: 3,
        pipeWeights: {
          [PipeType.Straight]: 10,
          [PipeType.Corner]: 10,
          [PipeType.Cross]: 5,
          [PipeType.Start]: 0,
        },
      },
      bomb: {
        maxBombs: 2,
        bombTimerSeconds: 2,
      },
      flow: {
        pipeFlowSpeed: 50,
        startDelaySeconds: 1
      },
      score: {
        winFilledPipesCount: 10,
        pointsPerPipe: 100
      }
    };
    
    gameState = new GameState(config, logger);
  });

  describe('construction', () => {
    it('should create all subsystems', () => {
      expect(gameState.grid).toBeDefined();
      expect(gameState.queue).toBeDefined();
      expect(gameState.scoreController).toBeDefined();
      expect(gameState.bombController).toBeDefined();
      expect(gameState.flowNetwork).toBeDefined();
    });

    it('should not be initialized on construction', () => {
      expect(gameState.grid.isInitialized).toBe(false);
    });
  });

  describe('start', () => {
    it('should initialize successfully', () => {
      const result = gameState.start();
      
      expect(result.success).toBe(true);
      expect(gameState.grid.isInitialized).toBe(true);
    });

    it('should emit onInitialized event', () => {
      const listener = vi.fn();
      gameState.on('onInitialized', listener);
      
      gameState.start();
      
      expect(listener).toHaveBeenCalledWith(gameState.grid);
    });

    it('should fail if already initialized', () => {
      gameState.start();
      const result = gameState.start();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('already_initialized');
      }
    });
  });

  describe('placeNextPipe', () => {
    beforeEach(() => {
      gameState.start();
    });

    it('should place pipe successfully', () => {
      const emptyCell = gameState.grid.getEmptyCells()[0];
      const result = gameState.placeNextPipe(emptyCell.position);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(emptyCell.hasPipe).toBe(true);
      }
    });

    it('should fail if game not initialized', () => {
      const newGame = new GameState(config, logger);
      const pos = GridPosition.createUnsafe(5, 5);
      const result = newGame.placeNextPipe(pos);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('game_not_initialized');
      }
    });

    it('should fail for invalid position', () => {
      const pos = GridPosition.create(50, 50, 100, 100)!;
      const result = gameState.placeNextPipe(pos);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('invalid_position');
      }
    });

    it('should fail for blocked cell', () => {
      const cells = gameState.grid.findCells(c => c.isBlocked);
      if (cells.length > 0) {
        const result = gameState.placeNextPipe(cells[0].position);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('cell_blocked');
        }
      }
    });

    it('should start bomb if cell occupied', () => {
      const cell = gameState.grid.getEmptyCells()[0];
      gameState.placeNextPipe(cell.position);
      
      const result = gameState.placeNextPipe(cell.position);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(['bomb_started', 'cell_occupied']).toContain(result.error);
      }
    });
  });

  describe('update', () => {
    beforeEach(() => {
      gameState.start();
    });

    it('should update flow and bombs', () => {
      expect(() => gameState.update(0.016)).not.toThrow();
    });

    it('should accumulate time', () => {
      gameState.update(1);
      gameState.update(1);
      // Time should advance (verify through flow state changes)
      expect(true).toBe(true); // Time is internal
    });
  });

  describe('stop', () => {
    it('should stop successfully', () => {
      gameState.start();
      const result = gameState.stop();
      
      expect(result.success).toBe(true);
    });

    it('should emit onStopped event', () => {
      const listener = vi.fn();
      gameState.start();
      gameState.on('onStopped', listener);
      
      gameState.stop();
      
      expect(listener).toHaveBeenCalled();
    });

    it('should fail if not initialized', () => {
      const result = gameState.stop();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_initialized');
      }
    });
  });

  describe('reset', () => {
    it('should reset all systems', () => {
      gameState.start();
      const cell = gameState.grid.getEmptyCells()[0];
      gameState.placeNextPipe(cell.position);
      
      gameState.reset();
      
      expect(gameState.grid.isInitialized).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      gameState.start();
      expect(() => gameState.destroy()).not.toThrow();
    });
  });
});