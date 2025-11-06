/**
 * The four cardinal directions on the grid.
 * Used for pipe connections and neighbor lookups.
 */
export enum Direction {
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}

/**
 * Type of pipe piece (shape). Determines which directions are open.
 */
export enum PipeType {
  Straight = "straight",
  Curve = "curve",
  Cross = "cross",
  Start = "start"
}

/**
 * Represents a single pipe piece on the grid.
 * Stores its type, orientation and connection logic.
 */
export class Pipe {
  readonly type: PipeType;
  readonly rotation: number; // 0, 90, 180, 270 (degrees clockwise)

  constructor(type: PipeType, rotation: number = 0) {
    this.type = type;
    this.rotation = rotation % 360;
  }

  /**
   * Returns the open directions for this pipe, after rotation is applied.
   */
  getConnections(): Direction[] {
    const base = this.getBaseConnections();
    return base.map(dir => this.rotateDirection(dir, this.rotation));
  }

  get assetKey(): string {
    switch (this.type) {
      case PipeType.Straight:
        return "pipe-straight";
      case PipeType.Curve:
        return "pipe-corner";
      case PipeType.Cross:
        return "pipe-cross";
      case PipeType.Start:
        return "pipe-start";
      default:
        return "pipe-unknown";
    }
  }

  /**
   * Defines the base (unrotated) open directions for each pipe type.
   */
  private getBaseConnections(): Direction[] {
    switch (this.type) {
      case PipeType.Straight:
        return [Direction.Up, Direction.Down];
      case PipeType.Curve:
        return [Direction.Up, Direction.Right];
      case PipeType.Cross:
        return [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
      case PipeType.Start:
        return [Direction.Right];
      default:
        return [];
    }
  }

  /**
   * Rotates a direction by a given angle (clockwise).
   */
  private rotateDirection(direction: Direction, rotation: number): Direction {
    const dirs = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
    const index = dirs.indexOf(direction);
    const offset = Math.floor(rotation / 90);
    return dirs[(index + offset) % dirs.length];
  }

  /**
   * Utility for debugging and rendering.
   */
  toString(): string {
    return `${this.type} (${this.rotation}°)`;
  }
}
