import type { GridCell } from "./GridCell";

/**
 * Cardinal directions on the grid.
 */
export enum Direction {
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}

/**
 * Available pipe piece types, each with distinct connection patterns.
 */
export enum PipeType {
  Straight = "straight",
  Curve = "curve",
  Cross = "cross",
  Start = "start",
}

/**
 * Represents a single pipe piece on the grid.
 * Immutable after construction to prevent invalid states.
 */
export class Pipe {
  public readonly rotation: number;

  constructor(
    public readonly type: PipeType,
    public readonly position: GridCell,
    rotation: number = 0
  ) {
    this.rotation = this.normalizeRotation(rotation);
  }

  /**
   * Gets all open connection directions for this pipe after rotation.
   */
  getConnections(): ReadonlyArray<Direction> {
    const baseConnections = this.getBaseConnections();
    return baseConnections.map(dir => this.rotateDirection(dir, this.rotation));
  }

  /**
   * Gets the asset key for rendering this pipe type.
   */
  get assetKey(): string {
    const assetKeyMap: Record<PipeType, string> = {
      [PipeType.Straight]: "pipe-straight",
      [PipeType.Curve]: "pipe-corner",
      [PipeType.Cross]: "pipe-cross",
      [PipeType.Start]: "pipe-start",
    };

    return assetKeyMap[this.type] ?? "pipe-unknown";
  }

  /**
   * Returns base (unrotated) connection directions for this pipe type.
   */
  private getBaseConnections(): Direction[] {
    const connectionMap: Record<PipeType, Direction[]> = {
      [PipeType.Straight]: [Direction.Right, Direction.Left],
      [PipeType.Curve]: [Direction.Up, Direction.Right],
      [PipeType.Cross]: [Direction.Up, Direction.Right, Direction.Down, Direction.Left],
      [PipeType.Start]: [Direction.Right],
    };

    return connectionMap[this.type] ?? [];
  }

  /**
   * Rotates a direction clockwise by the given angle.
   */
  private rotateDirection(direction: Direction, rotation: number): Direction {
    const directions = [Direction.Right, Direction.Down, Direction.Left, Direction.Up];
    const currentIndex = directions.indexOf(direction);
    const rotationSteps = Math.floor(rotation / 90);
    const newIndex = (currentIndex + rotationSteps) % directions.length;
    
    return directions[newIndex];
  }

  /**
   * Normalizes rotation to 0-270 range in 90° increments.
   */
  private normalizeRotation(rotation: number): number {
    const normalized = ((rotation % 360) + 360) % 360;
    return Math.floor(normalized / 90) * 90;
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `pipe-${this.type}(${this.rotation}°)`;
  }
}