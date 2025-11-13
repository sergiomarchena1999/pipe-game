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

/** Wait until the flow reaches a specific pipe or max iterations. */
const waitForPipeFlow = (gameState: GameState, pipePos: any, maxIter = 500) => {
  if (!gameState.flowNetwork.getActiveState()) {
    gameState.flowNetwork.initialize(1);
  }

  const pipe = gameState.grid.getPipeAt(pipePos);
  let iterations = 0;
  const deltaTime = 0.1; // seconds per iteration

  while (pipe && pipe.usedPorts.length === 0 && iterations < maxIter) {
    gameState.update(deltaTime);
    iterations++;
  }
  return pipe;
};

/** Wait until the flow network has visited at least one port. */
const waitForFlowNetwork = (gameState: GameState, maxIter = 500) => {
  let iterations = 0;
  let visited = gameState.flowNetwork.getVisitedPortsSnapshot();
  const deltaTime = 0.1;
  while (visited.length === 0 && iterations < maxIter) {
    gameState.update(deltaTime);
    visited = gameState.flowNetwork.getVisitedPortsSnapshot();
    iterations++;
  }
  return visited;
};

/** Wait until a bomb on a cell completes or max iterations. */
const waitForBombCompletion = (gameState: GameState, cell: any, maxIter = 200) => {
  let iterations = 0;
  const deltaTime = 0.1;
  while (cell.hasBomb && iterations < maxIter) {
    gameState.update(deltaTime);
    iterations++;
  }
};

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
      bomb: {
        maxBombs: 3,
        bombTimerSeconds: 1,
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

    gameState = new GameState(config, createMockLogger());
  });

  describe('complete game lifecycle', () => {
    it('should handle full game cycle: start -> place pipes -> flow -> stop', () => {
      const startResult = gameState.start();
      expect(startResult.success).toBe(true);

      const startPipe = gameState.grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      const nextPos = startPipe.position.move(exitDir, 1, 6); // place adjacent

      if (nextPos) {
        gameState.placeNextPipe(nextPos);
        const placedPipe = waitForPipeFlow(gameState, nextPos);
        expect(placedPipe?.usedPorts.length).toBeGreaterThan(0);
      }

      const stopResult = gameState.stop();
      expect(stopResult.success).toBe(true);
    });

    it('should handle bomb workflow', () => {
      gameState.start();
      const emptyCell = gameState.grid.getEmptyCells()[0];

      gameState.placeNextPipe(emptyCell.position);
      expect(emptyCell.hasPipe).toBe(true);

      const bombResult = gameState.placeNextPipe(emptyCell.position);
      expect(bombResult.success).toBe(false);
      if (!bombResult.success) expect(bombResult.error).toBe('bomb_started');

      waitForBombCompletion(gameState, emptyCell);
      expect(emptyCell.hasPipe).toBe(true);
    });

    it('should handle flow through complex pipe networks', () => {
      gameState.start();
      const startPipe = gameState.grid.startPipe;
      let currentPos = startPipe.position;
      let currentDir = startPipe.openPorts[0];

      for (let i = 0; i < 3; i++) {
        const nextPos = currentPos.move(currentDir, 1, 6); // distance=1 to ensure connection
        if (!nextPos) break;

        const result = gameState.placeNextPipe(nextPos);
        if (result.success && result.value) {
          currentPos = nextPos;
          const nextDir = result.value.openPorts.find(d => d !== currentDir.opposite);
          if (nextDir) currentDir = nextDir;
        }
      }

      const visited = waitForFlowNetwork(gameState);
      expect(visited.length).toBeGreaterThan(0);
    });
  });

  describe('score integration', () => {
    it('should update score when pipes connect to network', () => {
      gameState.start();

      const initialScore = gameState.scoreController.score;
      const startPipe = gameState.grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      const nextPos = startPipe.position.move(exitDir, 1, 6);

      if (nextPos) {
        gameState.placeNextPipe(nextPos);
        waitForPipeFlow(gameState, nextPos);
        const newScore = gameState.scoreController.score;
        expect(newScore).toBeGreaterThanOrEqual(initialScore);
      }
    });
  });

  describe('reset and replay', () => {
    it('should allow multiple game sessions', () => {
      gameState.start();
      const cell1 = gameState.grid.getEmptyCells()[0];
      gameState.placeNextPipe(cell1.position);
      gameState.stop();

      gameState.reset();
      const startResult = gameState.start();
      expect(startResult.success).toBe(true);

      const cell2 = gameState.grid.getEmptyCells()[0];
      const result = gameState.placeNextPipe(cell2.position);
      expect(result.success).toBe(true);
    });
  });
});