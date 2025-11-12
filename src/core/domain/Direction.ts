
type DirectionName = "up" | "right" | "down" | "left";

/**
 * Represents a cardinal direction on the grid.
 * Immutable value object with helper methods for rotation and navigation.
 */
export class Direction {
  private constructor(
    public readonly name: DirectionName,
    public readonly dx: number,
    public readonly dy: number,
    public readonly angle: number
  ) {}

  static readonly Up = new Direction("up", 0, -1, 270);
  static readonly Right = new Direction("right", 1, 0, 0);
  static readonly Down = new Direction("down", 0, 1, 90);
  static readonly Left = new Direction("left", -1, 0, 180);

  static readonly All: readonly Direction[] = [
    Direction.Up,
    Direction.Right,
    Direction.Down,
    Direction.Left,
  ];

  private static readonly byAngle = new Map<number, Direction>([
    [0, Direction.Right],
    [90, Direction.Down],
    [180, Direction.Left],
    [270, Direction.Up],
  ]);

  private static readonly opposites = new Map<Direction, Direction>([
    [Direction.Up, Direction.Down],
    [Direction.Right, Direction.Left],
    [Direction.Down, Direction.Up],
    [Direction.Left, Direction.Right],
  ]);

  /**
   * Returns a Direction instance for the given angle (0, 90, 180, 270).
   * @throws {Error} if angle is not a valid cardinal direction
   */
  static fromAngle(angle: number): Direction {
    const normalized = ((angle % 360) + 360) % 360;
    const direction = Direction.byAngle.get(normalized);
    
    if (!direction) {
      throw new Error(`Invalid angle ${angle}. Must be 0, 90, 180, or 270 degrees.`);
    }
    
    return direction;
  }

  /**
   * Safely attempts to create a Direction from an angle.
   * Returns null if the angle is invalid.
   */
  static tryFromAngle(angle: number): Direction | null {
    const normalized = ((angle % 360) + 360) % 360;
    return Direction.byAngle.get(normalized) ?? null;
  }

  /** Returns the opposite direction. */
  get opposite(): Direction {
    return Direction.opposites.get(this)!;
  }

  /**
   * Rotates this direction clockwise by the specified number of 90° steps.
   * @param steps Number of 90° rotations (can be negative for counter-clockwise)
   */
  rotate90(steps: number = 1): Direction {
    const index = Direction.All.indexOf(this);
    const normalizedSteps = ((steps % 4) + 4) % 4;
    const newIndex = (index + normalizedSteps) % Direction.All.length;
    return Direction.All[newIndex];
  }

  /** Returns new coordinates offset from the given position in this direction. */
  offset(x: number, y: number): { readonly x: number; readonly y: number } {
    return { x: x + this.dx, y: y + this.dy };
  }

  /** Returns a string representation for debugging. */
  toString(): string {
    return this.name;
  }
}