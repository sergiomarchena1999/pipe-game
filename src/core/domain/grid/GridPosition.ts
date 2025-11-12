import type { Direction } from "../Direction";
import type { Result } from "../../ResultTypes";
import { Result as R } from "../../ResultTypes";


/**
 * Branded types for type-safe coordinates.
 * Prevents accidentally mixing raw numbers with validated grid positions.
 */
type GridX = number & { readonly __brand: "GridX" };
type GridY = number & { readonly __brand: "GridY" };

/**
 * Represents a valid, in-bounds position within a grid.
 * This is an immutable value object that can only be created through
 * the factory method, ensuring all instances are valid.
 */
export class GridPosition {
  private constructor(
    public readonly x: GridX,
    public readonly y: GridY
  ) {}

  /** Factory ensures valid coordinates within the grid */
  static create(x: number, y: number, width: number, height: number): GridPosition | null {
    if (!GridPosition.isValid(x, y, width, height)) {
      return null;
    }
    return new GridPosition(x as GridX, y as GridY);
  }

  /** Creates a GridPosition, returning a Result type for explicit error handling. */
  static tryCreate(x: number, y: number, width: number, height: number): Result<GridPosition, 'position_out_of_bounds'> {
    if (!GridPosition.isValid(x, y, width, height)) {
      return R.fail('position_out_of_bounds');
    }
    return R.ok(new GridPosition(x as GridX, y as GridY));
  }

  /**
   * Creates a GridPosition without validation.
   * Use only when you're certain coordinates are valid (e.g., from trusted source).
   * @internal
   */
  static createUnsafe(x: number, y: number): GridPosition {
    return new GridPosition(x as GridX, y as GridY);
  }

  /** Validates coordinates without creating an instance. */
  static isValid(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && y >= 0 && x < width && y < height;
  }

  /**
   * Returns a new position offset in the given direction.
   * Returns null if the new position would be out of bounds.
   */
  move(direction: Direction, width: number, height: number): GridPosition | null {
    const newX = this.x + direction.dx;
    const newY = this.y + direction.dy;
    return GridPosition.create(newX, newY, width, height);
  }

  /** Checks value equality with another position. */
  equals(other: GridPosition): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /** String representation for debugging */
  toString(): string {
    return `(${this.x},${this.y})`;
  }
}