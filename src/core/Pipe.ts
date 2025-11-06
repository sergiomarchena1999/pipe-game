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
  const baseConnections = this.getBaseConnections();

  // Calculate how many 90° steps to rotate each base connection
  const baseDirIndex = Direction.All.indexOf(this.direction);
  return baseConnections.map(dir => dir.rotate90(baseDirIndex));
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
   * Returns base (unrotated) connection directions for this pipe type.
   */
  private getBaseConnections(): Direction[] {
    const connectionMap: Record<PipeType, Direction[]> = {
      [PipeType.Straight]: [Direction.Right, Direction.Left],
      [PipeType.Corner]: [Direction.Up, Direction.Right],
      [PipeType.Cross]: [Direction.Up, Direction.Right, Direction.Down, Direction.Left],
      [PipeType.Start]: [Direction.Right],
    };

    return connectionMap[this.type] ?? [];
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `pipe-${this.type}(${this.direction})`;
  }
}