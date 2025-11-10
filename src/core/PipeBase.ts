import type { PipeShape } from "./constants/PipeShapes";
import { Direction } from "./Direction";


/**
 * Base class for any pipe piece (either in queue or placed on grid).
 * Holds the shape and orientation (rotation).
 */
export abstract class PipeBase {
  constructor(
    public readonly shape: PipeShape,
    public readonly direction: Direction
  ) {}

  /** Returns a key for rendering or caching. */
  get assetKey(): string {
    return `pipe-${this.shape.id}`;
  }

  /** Returns a readable string for debugging/logging. */
  toString(): string {
    return `${this.shape.id}(${this.direction})`;
  }
}