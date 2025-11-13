import { PipeType } from "../core/constants/PipeShapes";
import type { Difficulty } from "./DifficultyConfig";


/**
 * Type-safe game configuration interface.
 * All fields are readonly to prevent accidental mutation.
 */
export interface IGameConfig {
  readonly difficulty: Difficulty;
  readonly grid: IGridConfig;
  readonly queue: IQueueConfig;
  readonly bomb: IBombConfig;
  readonly flow: IFlowConfig;
  readonly score: IScoreConfig;
}

/** Bomb behavior configuration. */
export interface IBombConfig {
  readonly bombTimerSeconds: number;
  readonly maxBombs: number;
}

/** Bomb behavior configuration. */
export interface IQueueConfig {
  readonly pipeWeights: PipeWeights;
  readonly maxSize: number;
}

/** Grid layout and appearance configuration. */
export interface IGridConfig {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly blockedPercentage: number;
  readonly allowStartPipeOnEdge: boolean;
}

/** Flow behavior configuration. */
export interface IFlowConfig {
  readonly startDelaySeconds: number;
  readonly pipeFlowSpeed: number;
}

/** Flow behavior configuration. */
export interface IScoreConfig {
  readonly winFilledPipesCount: number;
  readonly pointsPerPipe: number;
}

/**
 * Weighted distribution for pipe generation.
 * Higher weights = more frequent appearance.
 */
export interface PipeWeights {
  readonly [PipeType.Start]: 0; // Start pipe never generated
  readonly [PipeType.Straight]: number;
  readonly [PipeType.Corner]: number;
  readonly [PipeType.Cross]: number;
}