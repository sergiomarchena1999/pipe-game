
/** Strongly typed grid coordinates. */
type GridX = number & { readonly __brand: "GridX" };
type GridY = number & { readonly __brand: "GridY" };

/** Represents a valid, in-bounds position within the grid. */
export class GridPosition {
  private constructor(
    public readonly x: GridX,
    public readonly y: GridY
  ) {}

  /** Factory ensures valid coordinates within the grid */
  static create(x: number, y: number, width: number, height: number): GridPosition | null {
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return new GridPosition(x as GridX, y as GridY);
  }

  /** String representation for debugging */
  toString(): string {
    return `(${this.x},${this.y})`;
  }
}