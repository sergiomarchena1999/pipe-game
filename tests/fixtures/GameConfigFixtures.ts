import type { IGameConfig, IGridConfig, IQueueConfig, IBombConfig } from "../../src/config/GameConfig";
import { Difficulty } from "../../src/config/DifficultyConfig";
import { PipeType } from "../../src/core/constants/PipeShapes"


export const createTestGridConfig = (overrides?: Partial<IGridConfig>): IGridConfig => ({
  width: 10,
  height: 8,
  cellSize: 32,
  blockedPercentage: 0,
  allowStartPipeOnEdge: false,
  ...overrides,
});

export const createTestQueueConfig = (overrides?: Partial<IQueueConfig>): IQueueConfig => ({
  maxSize: 3,
  pipeWeights: {
    [PipeType.Straight]: 10,
    [PipeType.Corner]: 10,
    [PipeType.Cross]: 5,
    [PipeType.Start]: 0,
  },
  ...overrides,
});

export const createTestBombConfig = (overrides?: Partial<IBombConfig>): IBombConfig => ({
  maxBombs: 2,
  bombTimerSeconds: 2,
  ...overrides,
});

export const createTestGameConfig = (overrides?: Partial<IGameConfig>): IGameConfig => ({
  difficulty: Difficulty.Medium,
  grid: createTestGridConfig(overrides?.grid),
  queue: createTestQueueConfig(overrides?.queue),
  bombConfig: createTestBombConfig(overrides?.bombConfig),
  pipeFlowSpeed: 50,
  flowStartDelaySeconds: 1,
  ...overrides,
});