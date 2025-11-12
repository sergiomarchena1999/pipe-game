import { PipeType } from "../core/constants/PipeShapes";
import type { Difficulty } from "./DifficultyConfig";


/** Type-safe game configuration interface. */
export interface IGameConfig {
  readonly queueSize: number;
  readonly grid: IGridConfig;
  readonly difficulty: Difficulty;
  readonly pipeWeights: Record<PipeType, number>;
  readonly bombConfig: IBombConfig;
  readonly flowStartDelaySeconds: number;
  readonly pipeFlowSpeed: number;
}

export interface IBombConfig {
  readonly bombTimerSeconds: number;
  readonly maxBombs: number;
}

export interface IGridConfig {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly blockedPercentage: number;
  readonly allowStartPipeOnEdge: boolean;
}

/**
 * Validates game configuration.
 * @throws {Error} if configuration is invalid
 */
export function validateGameConfig(config: IGameConfig): void {
  if (config.grid.width <= 0 || config.grid.height <= 0) {
    throw new Error("Grid dimensions must be positive");
  }

  if (config.grid.allowStartPipeOnEdge && (config.grid.width < 3 || config.grid.height < 3)) {
    throw new Error("Grid must be at least 3x3 when startPipeOnEdge is enabled");
  }

  if (config.queueSize < 0) {
    throw new Error("Queue size must be greater than 0");
  }

  if (config.grid.cellSize <= 0) {
    throw new Error("Cell size must be positive");
  }

  if (config.bombConfig.bombTimerSeconds < 0) {
    throw new Error("Bomb timer must be greater than 0");
  }

  if (config.bombConfig.maxBombs <= 0) {
    throw new Error("Maximum bombs must be positive");
  }

  if (config.pipeFlowSpeed < 0) {
    throw new Error("Pipe Flow Speed must be greater than 0");
  }

  if (config.flowStartDelaySeconds < 0) {
    throw new Error("Pipe Flow Start Delay must be greater than 0");
  }

  validatePipeWeights(config.pipeWeights);
}

/** Validates that all weights are positive and sum to > 0. */
function validatePipeWeights(weights: Record<PipeType, number>): void {
  const entries = Object.entries(weights);
  if (entries.length === 0) {
    throw new Error("Pipe weights must not be empty");
  }

  let total = 0;
  for (const [type, weight] of entries) {
    if (type === PipeType.Start) continue;
    if (weight <= 0 || !isFinite(weight)) {
      throw new Error(`Invalid weight for ${type}: ${weight}`);
    }
    total += weight;
  }

  if (total <= 0) {
    throw new Error("Total pipe weight must be greater than zero");
  }
}