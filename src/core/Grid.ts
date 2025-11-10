import type { IGameConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";

import { PipeShapes, PipeType } from "./constants/PipeShapes";
import { Difficulty } from "./Difficulty";
import { Direction } from "./Direction";
import { GridCell } from "./GridCell";
import { Pipe } from "./Pipe";


/**
 * Represents the game grid that manages pipe placement and validation.
 * Encapsulates all grid-related logic including initialization and validation.
 */
export class Grid {
  private readonly cells: ReadonlyArray<ReadonlyArray<GridCell>>;
  private readonly width: number;
  private readonly height: number;

  private _startPipe: Pipe | null = null;

  constructor(
    private readonly config: IGameConfig,
    private readonly logger: ILogger
  ) {
    this.width = config.grid.width;
    this.height = config.grid.height;

    this.validateDimensions(this.width, this.height);
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

    const blockedPercentage = this.getBlockedPercentageByDifficulty(this.config.difficulty);
    this.blockRandomCells(blockedPercentage);

    this._startPipe = this.createStartPipe();
  }

  /**
   * Returns the GridCell object at the given coordinates.
   * @throws {Error} if position is invalid
   */
  getCell(x: number, y: number): GridCell {
    this.validatePosition(x, y);
    return this.cells[y][x] as GridCell;
  }

  /** Returns true when the cell at (x,y) is empty (no pipe) and not blocked. */
  isCellEmpty(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) return false;
    const cell = this.cells[y][x];
    return !cell.blocked && cell.isEmpty();
  }

  /**
   * Retrieves the pipe at the specified coordinates.
   * @returns The pipe at the position, or null if empty or invalid
   */
  getPipeAt(x: number, y: number): Pipe | null {
    return this.isValidPosition(x, y) ? this.cells[y][x].pipe : null;
  }

  /**
   * Places a pipe at the specified coordinates.
   * @throws {Error} if position is invalid or blocked
   */
  setPipe(cell: GridCell, pipe: Pipe): void {
    this.validatePosition(cell.x, cell.y);
    if (cell.blocked) {
      throw new Error(`Cannot set pipe on blocked cell ${cell}`);
    }
    cell.setPipe(pipe);
    this.logger.debug(`Placed ${pipe} at ${cell} facing ${pipe.direction}`);
  }

  /**
   * Removes a pipe from the specified coordinates.
   * No-op if position is invalid or already empty.
   */
  removePipe(x: number, y: number): void {
    if (this.isValidPosition(x, y)) {
      this.cells[y][x].clearPipe();
      this.logger.debug(`Removed pipe from (${x}, ${y})`);
    }
  }

  /** Marks a specific cell as blocked (impassable). */
  blockCell(x: number, y: number): void {
    this.validatePosition(x, y);
    this.cells[y][x].block();
    this.logger.debug(`Cell (${x}, ${y}) marked as blocked`);
  }

  /** Returns true if the cell is blocked. */
  isBlocked(x: number, y: number): boolean {
    return this.isValidPosition(x, y) && this.cells[y][x].blocked;
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

    for (const dir of pipe.getOpenPorts()) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (!this.isValidPosition(nx, ny)) continue;
      if (this.isBlocked(nx, ny)) continue;

      const neighbor = this.getPipeAt(nx, ny);
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

  private validateDimensions(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid grid dimensions: ${width}x${height}. Both must be positive.`);
    }
    if (width > 100 || height > 100) {
      throw new Error(`Grid dimensions too large: ${width}x${height}. Maximum is 100x100.`);
    }
  }

  private validatePosition(x: number, y: number): void {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Position (${x}, ${y}) is outside grid bounds (${this.width}x${this.height})`);
    }
  }

  private initializeGrid(): GridCell[][] {
    return Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => new GridCell(x, y))
    );
  }

  private createStartPipe(): Pipe {
    const cell = this.selectRandomEmptyCell();
    const direction = this.selectValidStartDirection(cell);
    const startPipe = new Pipe(cell, PipeShapes[PipeType.Start], direction);

    this.setPipe(cell, startPipe);
    return startPipe;
  }

  private selectRandomEmptyCell(): GridCell {
    const emptyCells: GridCell[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
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
        if (cell.isEmpty() && !cell.blocked) {
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

  private getBlockedPercentageByDifficulty(difficulty?: Difficulty): number {
    switch (difficulty) {
      case Difficulty.Easy:
        return 5;
      case Difficulty.Medium:
        return 15;
      case Difficulty.Hard:
        return 30;
      default:
        return this.config.grid.blockedPercentage ?? 0;
    }
  }

  /**
   * Picks a random direction for the start pipe that ensures its output
   * points to a valid in-bounds neighbor cell.
   */
  private selectValidStartDirection(cell: GridCell): Direction {
    const validDirections = Direction.All.filter(direction =>
      this.isValidPosition(cell.x + direction.dx, cell.y + direction.dy)
    );

    if (validDirections.length === 0) {
      throw new Error(`No valid start directions for (${cell.x}, ${cell.y})`);
    }

    const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
    return randomDir;
  }
}