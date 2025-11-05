import type { Pipe } from "./Pipe";

/**
 * Represents a single cell within the Grid.
 * A cell may contain a Pipe, or be empty.
 */
export class GridCell {
  readonly x: number;
  readonly y: number;
  private _pipe: Pipe | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Returns the pipe currently in this cell (if any).
   */
  get pipe(): Pipe | null {
    return this._pipe;
  }

  /**
   * Places a pipe in this cell.
   */
  setPipe(pipe: Pipe): void {
    this._pipe = pipe;
  }

  /**
   * Removes the pipe from this cell.
   */
  clearPipe(): void {
    this._pipe = null;
  }

  /**
   * Whether this cell is currently empty.
   */
  isEmpty(): boolean {
    return this._pipe === null;
  }

  /**
   * Returns a lightweight descriptor useful for debugging or serialization.
   */
  toJSON(): { x: number; y: number; hasPipe: boolean } {
    return { x: this.x, y: this.y, hasPipe: !!this._pipe };
  }
}