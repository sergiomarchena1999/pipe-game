import type { Pipe } from "./Pipe";

/**
 * Represents a single cell within the grid.
 * Immutable position, mutable pipe content.
 */
export class GridCell {
  private _pipe: Pipe | null = null;
  private _blocked = false;

  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    if (x < 0 || y < 0) {
      throw new Error(`Invalid cell coordinates: (${x}, ${y})`);
    }
  }

  /** Returns true if cell is blocked. */
  get blocked(): boolean {
    return this._blocked;
  }

  /** Gets the pipe currently occupying this cell. */
  get pipe(): Pipe | null {
    return this._pipe;
  }

  /** Places a pipe in this cell, replacing any existing pipe. */
  set pipe(pipe: Pipe) {
    if (this._blocked) {
      throw new Error(`Cannot place pipe on blocked cell (${this.x}, ${this.y})`);
    }
    this._pipe = pipe;
  }

  /** Removes any pipe from this cell. */
  clearPipe(): void {
    this._pipe = null;
  }

  /** Blocks this cell so that no pipe can be placed here. */
  block(): void {
    this._blocked = true;
    this._pipe = null; // ensure it's empty
  }

  /** Unblocks this cell. */
  unblock(): void {
    this._blocked = false;
  }

  /** Checks if this cell is currently empty. */
  isEmpty(): boolean {
    return this._pipe === null;
  }

  /** Returns a string representation of this cell's position. */
  toString(): string {
    return `(${this.x}, ${this.y})${this._blocked ? "[BLOCKED]" : ""}`;
  }
}