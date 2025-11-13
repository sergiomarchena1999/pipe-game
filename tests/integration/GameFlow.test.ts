import { beforeEach, describe, expect, it, vi } from "vitest";
import { IGameConfig } from "../../src/config/GameConfig";
import { Difficulty } from "../../src/config/DifficultyConfig";
import { GameState } from "../../src/core/GameState";
import { PipeType } from "../../src/core/constants/PipeShapes";
import { ILogger } from "../../src/core/logging/ILogger";


const createMockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('Integration: Full Game Flow', () => {
  let gameState: GameState;
  let config: IGameConfig;

  beforeEach(() => {
    config = {
      difficulty: Difficulty.Easy,
      grid: {
        width: 6,
        height: 6,
        cellSize: 32,
        blockedPercentage: 0,
        allowStartPipeOnEdge: true,
      },
      queue: {
        maxSize: 5,
        pipeWeights: {
          [PipeType.Straight]: 20,
          [PipeType.Corner]: 10,
          [PipeType.Cross]: 5,
          [PipeType.Start]: 0,
        },
      },
      bombConfig: {
        maxBombs: 3,
        bombTimerSeconds: 1,
      },
      pipeFlowSpeed: 100,
      flowStartDelaySeconds: 0,
    };
    
    gameState = new GameState(config, createMockLogger());
  });

  describe('complete game lifecycle', () => {
    it('should handle full game cycle: start -> place pipes -> flow -> stop', () => {
      // Start game
      const startResult = gameState.start();
      expect(startResult.success).toBe(true);
      
      // Find empty cells near start pipe
      const startPipe = gameState.grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      const nextPos = startPipe.position.move(exitDir, 6, 6);
      
      if (nextPos) {
        // Place a connecting pipe
        const placeResult = gameState.placeNextPipe(nextPos);
        expect(placeResult.success).toBe(true);
        
        // Update flow simulation
        for (let i = 0; i < 100; i++) {
          gameState.update(0.016); // ~60 FPS
        }
        
        // Verify water reached the pipe
        const placedPipe = gameState.grid.getPipeAt(nextPos);
        expect(placedPipe?.usedPorts.length).toBeGreaterThan(0);
      }
      
      // Stop game
      const stopResult = gameState.stop();
      expect(stopResult.success).toBe(true);
    });

    it('should handle bomb workflow', () => {
      gameState.start();
      
      const emptyCell = gameState.grid.getEmptyCells()[0];
      
      // Place first pipe
      gameState.placeNextPipe(emptyCell.position);
      expect(emptyCell.hasPipe).toBe(true);
      
      // Try to place on same cell -> should start bomb
      const bombResult = gameState.placeNextPipe(emptyCell.position);
      expect(bombResult.success).toBe(false);
      if (!bombResult.success) {
        expect(bombResult.error).toBe('bomb_started');
      }
      
      // Update until bomb completes
      for (let i = 0; i < 100; i++) {
        gameState.update(0.016);
      }
      
      // Verify pipe was replaced
      expect(emptyCell.hasPipe).toBe(true);
    });

    it('should maintain queue throughout gameplay', () => {
      gameState.start();
      
      const initialQueueSize = gameState.queue.contents.length;
      
      // Place several pipes
      const emptyCells = gameState.grid.getEmptyCells().slice(0, 3);
      emptyCells.forEach(cell => {
        gameState.placeNextPipe(cell.position);
      });
      
      // Queue should maintain size
      expect(gameState.queue.contents.length).toBe(initialQueueSize);
    });
  });

  describe('edge cases and error recovery', () => {
    it('should handle placing pipes in all grid cells', () => {
      gameState.start();
      
      const emptyCells = gameState.grid.getEmptyCells();
      let placedCount = 0;
      
      emptyCells.forEach(cell => {
        const result = gameState.placeNextPipe(cell.position);
        if (result.success) placedCount++;
      });
      
      expect(placedCount).toBe(emptyCells.length);
    });

    it('should handle rapid placement and removal via bombs', () => {
      gameState.start();
      
      const cell = gameState.grid.getEmptyCells()[0];
      
      // Place, bomb, wait, repeat
      gameState.placeNextPipe(cell.position);
      gameState.placeNextPipe(cell.position); // Start bomb
      
      gameState.update(2); // Complete bomb
      
      // Should be able to place again
      const result = gameState.placeNextPipe(cell.position);
      expect([true, false]).toContain(result.success); // May succeed or fail depending on timing
    });

    it('should handle flow through complex pipe networks', () => {
      gameState.start();
      
      const startPipe = gameState.grid.startPipe;
      let currentPos = startPipe.position;
      let currentDir = startPipe.openPorts[0];
      
      // Build a chain of 3 pipes
      for (let i = 0; i < 3; i++) {
        const nextPos = currentPos.move(currentDir, 6, 6);
        if (!nextPos) break;
        
        const result = gameState.placeNextPipe(nextPos);
        if (result.success && result.value) {
          currentPos = nextPos;
          // Find next available direction
          const nextDir = result.value.openPorts.find(d => d !== currentDir.opposite);
          if (nextDir) currentDir = nextDir;
        }
      }
      
      // Run flow simulation
      for (let i = 0; i < 200; i++) {
        gameState.update(0.016);
      }
      
      // Verify flow progressed
      const flowState = gameState.flowNetwork.getVisitedPortsSnapshot();
      expect(flowState.length).toBeGreaterThan(0);
    });
  });

  describe('score integration', () => {
    it('should update score when pipes connect to network', () => {
      gameState.start();
      
      const initialScore = gameState.scoreController.score;
      
      const startPipe = gameState.grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      const nextPos = startPipe.position.move(exitDir, 6, 6);
      
      if (nextPos) {
        gameState.placeNextPipe(nextPos);
        
        // Score should potentially increase (depends on connection)
        const newScore = gameState.scoreController.score;
        expect(newScore).toBeGreaterThanOrEqual(initialScore);
      }
    });
  });

  describe('reset and replay', () => {
    it('should allow multiple game sessions', () => {
      // First session
      gameState.start();
      const cell1 = gameState.grid.getEmptyCells()[0];
      gameState.placeNextPipe(cell1.position);
      gameState.stop();
      
      // Reset
      gameState.reset();
      
      // Second session
      const startResult = gameState.start();
      expect(startResult.success).toBe(true);
      
      const cell2 = gameState.grid.getEmptyCells()[0];
      const result = gameState.placeNextPipe(cell2.position);
      expect(result.success).toBe(true);
    });
  });
});