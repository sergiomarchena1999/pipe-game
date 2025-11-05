import type { Logger } from "../utils/Logger"
import type { Pipe } from "./Pipe";
import { GridCell } from "./GridCell";

/**
 * Represents the logical grid of the game.
 * Responsible for managing cells, pipes and structural state.
 */
export class Grid {
  readonly width: number;
  readonly height: number;
  private readonly cells: GridCell[][];
  private readonly logger: Logger;

  constructor(width: number, height: number, logger: Logger) {
    this.width = width;
    this.height = height;
    this.logger = logger;
    this.cells = this.createEmptyGrid();
    this.logger.info(`Grid initialized: ${width}x${height}`);
  }

  /**
   * Creates an empty 2D grid of GridCells.
   */
  private createEmptyGrid(): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new GridCell(x, y));
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Returns the cell at a specific position, or null if out of bounds.
   */
  getCell(x: number, y: number): GridCell | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null;
    }
    return this.cells[y][x];
  }

  /**
   * Places a pipe into a specific cell.
   */
  placePipe(x: number, y: number, pipe: Pipe): boolean {
    const cell = this.getCell(x, y);
    if (!cell) {
      this.logger.warn(`Tried to place pipe out of bounds at ${x},${y}`);
      return false;
    }
    cell.setPipe(pipe);
    this.logger.debug(`Pipe placed at (${x}, ${y})`);
    return true;
  }

  /**
   * Removes the pipe from a cell.
   */
  removePipe(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    if (!cell || !cell.pipe) return false;
    cell.clearPipe();
    this.logger.debug(`Pipe removed at (${x}, ${y})`);
    return true;
  }

  /**
   * Returns a flat list of all cells (useful for iteration or rendering).
   */
  getAllCells(): GridCell[] {
    return this.cells.flat();
  }

  /**
   * Iterates over all cells with a callback.
   */
  forEachCell(callback: (cell: GridCell) => void): void {
    for (const row of this.cells) {
      for (const cell of row) {
        callback(cell);
      }
    }
  }

  /**
   * Logs the current state (useful for debugging).
   */
  debugPrint(): void {
    const rows = this.cells.map(row =>
      row.map(cell => (cell.pipe ? "O" : ".")).join(" ")
    );
    this.logger.info(`\n${rows.join("\n")}`);
  }
}