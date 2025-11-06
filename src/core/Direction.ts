/**
 * Represents a cardinal direction on the grid.
 * Provides helpers for rotation, offsets, and comparisons.
 */
export class Direction {
  private constructor(
    public readonly name: string,
    public readonly dx: number,
    public readonly dy: number
  ) {}

  static readonly Up = new Direction("up", 0, -1);
  static readonly Right = new Direction("right", 1, 0);
  static readonly Down = new Direction("down", 0, 1);
  static readonly Left = new Direction("left", -1, 0);

  static readonly All: readonly Direction[] = [
    Direction.Up,
    Direction.Right,
    Direction.Down,
    Direction.Left,
  ];

  /** Returns the opposite direction. */
  get opposite(): Direction {
    switch (this) {
      case Direction.Up: return Direction.Down;
      case Direction.Right: return Direction.Left;
      case Direction.Down: return Direction.Up;
      case Direction.Left: return Direction.Right;
      default: throw new Error("Invalid direction");
    }
  }

  /** Rotates this direction clockwise by a given number of 90° steps. */
  rotate90(steps: number = 1): Direction {
    const index = Direction.All.indexOf(this);
    const newIndex = (index + steps) % Direction.All.length;
    return Direction.All[newIndex];
  }

  /** Converts this direction to a 0–270° angle (Right = 0°, Down = 90°, etc.). */
  get angle(): number {
    switch (this) {
      case Direction.Right: return 0;
      case Direction.Down: return 90;
      case Direction.Left: return 180;
      case Direction.Up: return 270;
      default: return 0;
    }
  }

  /** Returns a new coordinate offset from (x, y) in this direction. */
  offset(x: number, y: number): { x: number; y: number } {
    return { x: x + this.dx, y: y + this.dy };
  }

  toString(): string {
    return this.name;
  }
}