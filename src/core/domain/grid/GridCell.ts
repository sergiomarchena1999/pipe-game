import type { GridPosition } from "./GridPosition";
import type { Pipe } from "../pipe/Pipe";


/**
 * Represents a single cell within the grid.
 * Immutable position, mutable pipe content.
 * 
 * This is a simple data holder - all complex logic lives in Grid.
 */
export class GridCell {
  private _pipe: Pipe | null = null;
  private _blocked = false;

  constructor(public readonly position: GridPosition) {}

  /** Returns true if this cell is blocked. */
  get isBlocked(): boolean {
    return this._blocked;
  }

  /** Gets the pipe currently occupying this cell. */
  get pipe(): Pipe | null {
    return this._pipe;
  }

  /** Checks if this cell is currently empty. */
  get isEmpty(): boolean {
    return this._pipe === null;
  }

  /** Checks if this cell has a pipe. */
  get hasPipe(): boolean {
    return this._pipe !== null;
  }

  /**
   * Places a pipe in this cell.
   * @throws {Error} if cell is blocked or already has a pipe
   * @internal
   */
  setPipe(pipe: Pipe): void {
    if (this._blocked) {
      throw new Error(
        `Cannot place pipe on blocked cell at ${this.position}`
      );
    }
    if (this._pipe !== null) {
      throw new Error(
        `Cell at ${this.position} already contains a pipe. Remove it first.`
      );
    }
    if (!pipe.position.equals(this.position)) {
      throw new Error(
        `Pipe position ${pipe.position} does not match cell position ${this.position}`
      );
    }
    this._pipe = pipe;
  }

  /**
   * Removes the pipe from this cell.
   * @internal
   */
  clearPipe(): void {
    this._pipe = null;
  }

  /**
   * Blocks this cell (removes any existing pipe).
   * @internal
   */
  block(): void {
    this._blocked = true;
    this._pipe = null;
  }

  /**
   * Unblocks this cell.
   * @internal
   */
  unblock(): void {
    this._blocked = false;
  }

  // ============================================================================
  // Debugging
  // ============================================================================

  /** Returns a string representation of this cell's position. */
  toString(): string {
    return `(${this.position} ${this._blocked ? "[BLOCKED]" : ""}`;
  }
}