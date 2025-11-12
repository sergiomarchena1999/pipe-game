import type { PipeWeights } from "../../../config/GameConfig";
import { PipeShapes, PipeType, type PipeShape } from "../../constants/PipeShapes";
import { Direction } from "../Direction";
import { PipeBase } from "./PipeBase";

/**
 * Responsible for weighted random pipe generation.
 * Separated from PipeQueue for easier testing.
 */
export class PipeGenerator {
  private readonly weightedEntries: Array<[PipeType, number]>;
  private readonly totalWeight: number;

  constructor(weights: PipeWeights) {
    this.weightedEntries = Object.entries(weights) as Array<[PipeType, number]>;
    this.totalWeight = this.weightedEntries.reduce((sum, [, w]) => sum + w, 0);

    if (this.totalWeight <= 0) {
      throw new Error("Total pipe weights must be greater than 0");
    }
  }

  /** Generates a random pipe based on configured weights. */
  generatePipe(): PipeBase {
    const shape = this.selectRandomShape();
    const direction = this.selectRandomDirection();
    return new PipeBase(shape, direction);
  }

  /** Selects a random pipe shape based on weights. */
  private selectRandomShape(): PipeShape {
    let random = Math.random() * this.totalWeight;

    for (const [type, weight] of this.weightedEntries) {
      random -= weight;
      if (random <= 0) {
        return PipeShapes[type];
      }
    }

    // Fallback to first entry (should never reach here)
    return PipeShapes[this.weightedEntries[0][0]];
  }

  /** Returns a random valid direction. */
  private selectRandomDirection(): Direction {
    const index = Math.floor(Math.random() * Direction.All.length);
    return Direction.All[index];
  }
}