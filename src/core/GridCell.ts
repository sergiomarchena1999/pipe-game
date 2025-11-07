import type { Pipe } from "./Pipe";

/**
 * Represents a single cell within the grid.
 * Immutable position, mutable pipe content.
 */
export class GridCell {
  private _pipe: Pipe | null = null;

  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    if (x < 0 || y < 0) {
      throw new Error(`Invalid cell coordinates: (${x}, ${y})`);
    }
  }

  /**
   * Gets the pipe currently occupying this cell.
   */
  get pipe(): Pipe | null {
    return this._pipe;
  }

  /**
   * Places a pipe in this cell, replacing any existing pipe.
   */
  setPipe(pipe: Pipe): void {
    this._pipe = pipe;
  }

  /**
   * Removes any pipe from this cell.
   */
  clearPipe(): void {
    this._pipe = null;
  }

  /**
   * Checks if this cell is currently empty.
   */
  isEmpty(): boolean {
    return this._pipe === null;
  }

  /**
   * Serializes cell data for debugging or persistence.
   */
  toJSON(): { x: number; y: number; hasPipe: boolean } {
    return { 
      x: this.x, 
      y: this.y, 
      hasPipe: this._pipe !== null 
    };
  }

  /**
   * Returns a string representation of this cell's position.
   */
  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}