import type { IGameConfig, IBombConfig, IGridConfig, PipeWeights } from "./GameConfig";
import type { Result } from "../core/ResultTypes";

import { Result as R } from "../core/ResultTypes";
import { PipeType } from "../core/constants/PipeShapes";
import { GameConfigValidator } from "./GameConfigValidator";


/** Available difficulty levels. */
export enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

/** Metadata about a difficulty level. */
export interface DifficultyMetadata {
  readonly name: string;
  readonly description: string;
  readonly recommendedFor: string;
  readonly estimatedDuration: string;
}

/** Complete difficulty preset with configuration and metadata. */
export interface DifficultyPreset {
  readonly config: Readonly<IGameConfig>;
  readonly metadata: DifficultyMetadata;
}

/** Manages difficulty presets and their configurations. */
export class DifficultyConfig {
  // ========================================================================
  // Grid Configurations
  // ========================================================================

  private static readonly EASY_GRID: IGridConfig = {
    width: 6,
    height: 6,
    cellSize: 64,
    blockedPercentage: 5,
    allowStartPipeOnEdge: false,
  };

  private static readonly MEDIUM_GRID: IGridConfig = {
    width: 8,
    height: 8,
    cellSize: 64,
    blockedPercentage: 10,
    allowStartPipeOnEdge: false,
  };

  private static readonly HARD_GRID: IGridConfig = {
    width: 10,
    height: 10,
    cellSize: 64,
    blockedPercentage: 15,
    allowStartPipeOnEdge: true,
  };

  // ========================================================================
  // Bomb Configurations
  // ========================================================================

  private static readonly EASY_BOMBS: IBombConfig = {
    maxBombs: 3,
    bombTimerSeconds: 0.5,
  };

  private static readonly MEDIUM_BOMBS: IBombConfig = {
    maxBombs: 2,
    bombTimerSeconds: 0.8,
  };

  private static readonly HARD_BOMBS: IBombConfig = {
    maxBombs: 1,
    bombTimerSeconds: 1.0,
  };

  // ========================================================================
  // Pipe Weight Configurations
  // ========================================================================

  private static readonly EASY_WEIGHTS: PipeWeights = {
    [PipeType.Start]: 0,
    [PipeType.Straight]: 0.4,
    [PipeType.Corner]: 0.5,
    [PipeType.Cross]: 0.1,
  };

  private static readonly MEDIUM_WEIGHTS: PipeWeights = {
    [PipeType.Start]: 0,
    [PipeType.Straight]: 0.25,
    [PipeType.Corner]: 0.55,
    [PipeType.Cross]: 0.20,
  };

  private static readonly HARD_WEIGHTS: PipeWeights = {
    [PipeType.Start]: 0,
    [PipeType.Straight]: 0.15,
    [PipeType.Corner]: 0.6,
    [PipeType.Cross]: 0.25,
  };

  // ========================================================================
  // Complete Configurations
  // ========================================================================

  private static readonly EASY_CONFIG: IGameConfig = {
    difficulty: Difficulty.Easy,
    queue: { maxSize: 5, pipeWeights: DifficultyConfig.EASY_WEIGHTS},
    grid: DifficultyConfig.EASY_GRID,
    bombConfig: DifficultyConfig.EASY_BOMBS,
    flowStartDelaySeconds: 12,
    pipeFlowSpeed: 15,
  };

  private static readonly MEDIUM_CONFIG: IGameConfig = {
    difficulty: Difficulty.Medium,
    queue: { maxSize: 5, pipeWeights: DifficultyConfig.MEDIUM_WEIGHTS},
    grid: DifficultyConfig.MEDIUM_GRID,
    bombConfig: DifficultyConfig.MEDIUM_BOMBS,
    flowStartDelaySeconds: 10,
    pipeFlowSpeed: 20,
  };

  private static readonly HARD_CONFIG: IGameConfig = {
    difficulty: Difficulty.Hard,
    queue: { maxSize: 5, pipeWeights: DifficultyConfig.HARD_WEIGHTS},
    grid: DifficultyConfig.HARD_GRID,
    bombConfig: DifficultyConfig.HARD_BOMBS,
    flowStartDelaySeconds: 8,
    pipeFlowSpeed: 25,
  };

  // ========================================================================
  // Public API
  // ========================================================================

  /**
 * Returns a frozen game configuration wrapped in a Result.
 * If validation fails, returns a failure result with error details.
 */
static getConfig(difficulty: Difficulty): Result<IGameConfig, string> {
  let config: IGameConfig;

  switch (difficulty) {
    case Difficulty.Easy:
      config = { ...this.EASY_CONFIG };
      break;
    case Difficulty.Medium:
      config = { ...this.MEDIUM_CONFIG };
      break;
    case Difficulty.Hard:
      config = { ...this.HARD_CONFIG };
      break;
    default:
      config = { ...this.MEDIUM_CONFIG };
  }

  const errors = GameConfigValidator.validate(config);
  if (errors.length > 0) {
    const message = errors.map(e => `${e.field ?? 'unknown'}: ${e.message}`).join("; ");
    return R.fail(message);
  }

  return R.ok(config);
}
}