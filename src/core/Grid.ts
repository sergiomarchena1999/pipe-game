import type { IGridConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";

import { PipeShapes, PipeType } from "./constants/PipeShapes";
import { Direction } from "./Direction";
import { GridCell } from "./GridCell";
import { Pipe } from "./Pipe";


/**
 * Represents the game grid that manages pipe placement and validation.
 * Encapsulates all grid-related logic including initialization.
 */
export class Grid {
  private readonly cells: ReadonlyArray<ReadonlyArray<GridCell>>;
  private readonly width: number;
  private readonly height: number;

  private _startPipe: Pipe | null = null;

  constructor(private readonly config: IGridConfig, private readonly logger: ILogger) {
    this.width = config.width;
    this.height = config.height;

    this.cells = this.initializeGrid();
    this.logger.info(`Grid initialized with dimensions ${this.width}x${this.height}`);
  }

  /**
   * The starting pipe for the game. Must be set during initialization.
   * @throws {Error} if accessed before initialization
   */
  get startPipe(): Pipe {
    if (!this._startPipe) {
      throw new Error("Grid has not been initialized. Call initialize() first.");
    }
    return this._startPipe;
  }

  /**
   * Initializes the grid with a starting pipe at a random valid position.
   * @throws {Error} if no valid positions are available
   */
  initialize(): void {
    if (this._startPipe) {
      this.logger.warn("Grid already initialized. Skipping re-initialization.");
      return;
    }

    this.blockRandomCells(this.config.blockedPercentage);
    this._startPipe = this.createStartPipe();
  }

  /**
   * Returns the GridCell object at the given coordinates.
   * @throws {Error} if position is invalid
   */
  getCell(x: number, y: number): GridCell {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Cannot get cell outside of grid ${x}, ${y}`);
    }

    return this.cells[y][x] as GridCell;
  }
  
  /**
   * Returns the GridCell object at the given coordinates.
   * @throws {Error} if position is invalid
   */
  tryGetCell(x: number, y: number): GridCell | null {
    if (!this.isValidPosition(x, y)) {
      return null;
    }

    return this.cells[y][x] as GridCell;
  }

  /** Returns true when the cell at (x,y) is empty (no pipe) and not blocked. */
  isCellEmpty(cell: GridCell): boolean {
    return !cell.blocked && cell.isEmpty();
  }

  /**
   * Places a pipe at the specified coordinates.
   * @throws {Error} if position is invalid or blocked
   */
  setPipe(cell: GridCell, pipe: Pipe): void {
    if (cell.blocked) {
      throw new Error(`Cannot set pipe on blocked cell ${cell}`);
    }
    cell.pipe = pipe;
    this.logger.debug(`Placed ${pipe} at ${cell} facing ${pipe.direction}`);
  }

  /**
   * Removes a pipe from the specified coordinates.
   * No-op if cell is empty or blocked.
   */
  removePipe(cell: GridCell): void {
    if (cell.isEmpty() || cell.blocked) return;

    cell.clearPipe();
    this.logger.debug(`Removed pipe from ${cell}`);
  }

  /** Marks a specific cell as blocked (impassable). */
  blockCell(cell: GridCell): void {
    if (!cell.isEmpty()) return;

    cell.block();
    this.logger.debug(`Cell ${cell} marked as blocked`);
  }

  /** Checks if the given coordinates are within grid boundaries. */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Returns true if this pipe is connected to at least one adjacent pipe. */
  isConnectedToNetwork(pipe: Pipe): boolean {
    return this.getConnectedNeighbors(pipe).length > 0;
  }

  /** Returns all pipes directly connected to the given pipe (one step away). */
  getConnectedNeighbors(pipe: Pipe): Pipe[] {
    const { x, y } = pipe.position;
    const neighbors: Pipe[] = [];

    for (const dir of pipe.openPorts) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      const cell = this.tryGetCell(nx, ny);
      if (!cell || cell.blocked) continue;

      const neighbor = cell.pipe;
      if (!neighbor) continue;

      if (neighbor.hasOpenPort(dir.opposite)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /** Clears all pipes from the grid, excluding the start pipe. */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x] as GridCell;
        if (cell.pipe !== this._startPipe) {
          cell.clearPipe();
        }
      }
    }
    this.logger.info("Grid cleared (start pipe preserved)");
  }

  private initializeGrid(): GridCell[][] {
    return Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => new GridCell(x, y))
    );
  }

  private createStartPipe(): Pipe {
    const cell = this.selectRandomEmptyCell(this.config.allowStartPipeOnEdge);
    const direction = this.selectValidStartDirection(cell);
    const startPipe = new Pipe(cell, PipeShapes[PipeType.Start], direction);

    this.setPipe(cell, startPipe);
    return startPipe;
  }

  private selectRandomEmptyCell(allowEdges: boolean): GridCell {
    let startx = allowEdges ? 0 : 1;
    let starty = allowEdges ? 0 : 1;
    const endX = allowEdges ? this.width  : this.width  - 1;
    const endY = allowEdges ? this.height : this.height - 1;
    const emptyCells: GridCell[] = [];
    for (starty = 0; starty < endY; starty++) {
      for (startx = 0; startx < endX; startx++) {
        const cell = this.cells[starty][startx];
        if (!cell.blocked && cell.isEmpty()) {
          emptyCells.push(cell);
        }
      }
    }

    if (emptyCells.length === 0) throw new Error("No empty cells available in the grid");
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  /**
   * Randomly blocks a percentage of cells in the grid.
   */
  private blockRandomCells(percentage: number): void {
    if (percentage <= 0) return;

    const totalCells = this.width * this.height;
    const cellsToBlock = Math.floor((percentage / 100) * totalCells);
    const available: GridCell[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (this.isCellEmpty(cell)) {
          available.push(cell);
        }
      }
    }

    // Randomly select cells to block
    for (let i = 0; i < cellsToBlock && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      const [cell] = available.splice(index, 1);
      cell.block();
    }

    this.logger.info(`Blocked ${cellsToBlock} cells (${percentage}%) for difficulty`);
  }

  /**
   * Picks a random direction for the start pipe that ensures its output
   * points to a valid in-bounds neighbor cell.
   */
  private selectValidStartDirection(cell: GridCell): Direction {
    const validDirections = Direction.All.filter(direction => {
      const neighbourX = cell.x + direction.dx;
      const neighbourY = cell.y + direction.dy

      const neighbourCell = this.tryGetCell(neighbourX, neighbourY);
      return neighbourCell && !neighbourCell.blocked;
    });

    if (validDirections.length === 0) {
      throw new Error(`No valid start directions for ${cell}`);
    }

    const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
    return randomDir;
  }
}