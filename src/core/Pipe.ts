import type { GridCell } from "./GridCell";
import { Direction } from "./Direction";


/**
 * Available pipe piece types, each with distinct connection patterns.
 */
export enum PipeType {
  Straight = "straight",
  Corner = "corner",
  Cross = "cross",
  Start = "start",
}

/**
 * Represents a single pipe piece on the grid.
 * Immutable after construction to prevent invalid states.
 */
export class Pipe {
  constructor(
    public readonly type: PipeType,
    public readonly position: GridCell,
    public readonly direction: Direction
  ) {}

  /**
   * Gets all open connection directions for this pipe.
   */
  getConnections(): readonly Direction[] {
    switch (this.type) {
      case PipeType.Straight:
        // Straight pipes only allow horizontal or vertical depending on orientation
        if (this.direction === Direction.Up || this.direction === Direction.Down) {
          return [Direction.Up, Direction.Down];
        } else {
          return [Direction.Left, Direction.Right];
        }

      case PipeType.Corner:
        switch (this.direction) {
          case Direction.Up:
            return [Direction.Left, Direction.Up];
          case Direction.Right:
            return [Direction.Up, Direction.Right];
          case Direction.Down:
            return [Direction.Right, Direction.Down];
          case Direction.Left:
            return [Direction.Down, Direction.Left];
          default:
            return [];
        }

      case PipeType.Cross:
        // Cross pipes always open in all directions
        return Direction.All;

      case PipeType.Start:
        // Only outputs in the facing direction
        return [this.direction];

      default:
        return [];
    }
  }

  /**
   * Gets the asset key for rendering this pipe type.
   */
  get assetKey(): string {
    const assetKeyMap: Record<PipeType, string> = {
      [PipeType.Straight]: "pipe-straight",
      [PipeType.Corner]: "pipe-corner",
      [PipeType.Cross]: "pipe-cross",
      [PipeType.Start]: "pipe-start",
    };

    return assetKeyMap[this.type] ?? "pipe-unknown";
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `pipe-${this.type}(${this.direction})`;
  }
}