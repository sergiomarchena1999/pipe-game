import type { IGameConfig } from "./GameConfig";
import { PipeType } from "../core/constants/PipeShapes";


export enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

export class DifficultyConfig {
  /**
   * Returns a preset game configuration for a given difficulty.
   */
  static get(difficulty: Difficulty): Readonly<IGameConfig> {
    switch (difficulty) {
      case Difficulty.Easy:
        return Object.freeze({
          difficulty: Difficulty.Easy,
          queueSize: 5,
          grid: { width: 6, height: 6, cellSize: 64, blockedPercentage: 5, allowStartPipeOnEdge: false },
          bombConfig: { maxBombs: 3, bombTimerSeconds: 0.5 },
          flowStartDelaySeconds: 12,
          pipeFlowSpeed: 15,
          pipeWeights: {
            [PipeType.Start]: 0,
            [PipeType.Straight]: 0.4,
            [PipeType.Corner]: 0.5,
            [PipeType.Cross]: 0.1,
          },
        });

      case Difficulty.Medium:
        return Object.freeze({
          difficulty: Difficulty.Medium,
          queueSize: 5,
          grid: { width: 8, height: 8, cellSize: 64, blockedPercentage: 10, allowStartPipeOnEdge: false },
          bombConfig: { maxBombs: 2, bombTimerSeconds: 0.8 },
          flowStartDelaySeconds: 10,
          pipeFlowSpeed: 20,
          pipeWeights: {
            [PipeType.Start]: 0,
            [PipeType.Straight]: 0.25,
            [PipeType.Corner]: 0.55,
            [PipeType.Cross]: 0.20,
          },
        });

      case Difficulty.Hard:
        return Object.freeze({
          difficulty: Difficulty.Hard,
          queueSize: 6,
          grid: { width: 10, height: 10, cellSize: 64, blockedPercentage: 15, allowStartPipeOnEdge: true },
          bombConfig: { maxBombs: 1, bombTimerSeconds: 1 },
          flowStartDelaySeconds: 8,
          pipeFlowSpeed: 25,
          pipeWeights: {
            [PipeType.Start]: 0,
            [PipeType.Straight]: 0.15,
            [PipeType.Corner]: 0.6,
            [PipeType.Cross]: 0.25,
          },
        });

      default:
        return this.get(Difficulty.Medium);
    }
  }
}