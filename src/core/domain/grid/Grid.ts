import type { IGridConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../logging/ILogger";
import type { Result } from "../../ResultTypes";

import { Result as R } from "../../ResultTypes";
import { PipeShapes, PipeType } from "../../constants/PipeShapes";
import { GridPosition } from "./GridPosition";
import { Direction } from "../Direction";
import { GridCell } from "./GridCell";
import { Pipe } from "../pipe/Pipe";


/**
 * Represents the game grid that manages pipe placement and validation.
 * This is the authoritative source for all grid state.
 */
export class Grid {
  private readonly cells: ReadonlyArray<ReadonlyArray<GridCell>>;
  private readonly width: number;
  private readonly height: number;
  private _startPipe: Pipe | null = null;
  private _initialized = false;

  constructor(
    private readonly config: IGridConfig,
    private readonly logger: ILogger
  ) {
    this.width = config.width;
    this.height = config.height;
    this.cells = this.initializeGrid();
    
    this.logger.info(`Grid created with dimensions ${this.dimensions}`);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initializes the grid with blocked cells and start pipe.
   * Must be called before the grid can be used.
   * @returns Result indicating success or failure
   */
  initialize(): Result<void, 'already_initialized' | 'initialization_failed'> {
    if (this._initialized) {
      this.logger.warn("Grid already initialized");
      return R.fail('already_initialized');
    }

    try {
      const startPipeResult = this.createStartPipe();
      if (!startPipeResult.success) {
        return R.fail('initialization_failed');
      }

      this._startPipe = startPipeResult.value;
      const protectedPos = this._startPipe.position.move(this._startPipe.direction, this.width, this.height);

      this.blockRandomCells(this.config.blockedPercentage, protectedPos ? [protectedPos] : []);
      this._initialized = true;
      
      this.logger.info("Grid initialized successfully");
      return R.ok(undefined);
    } catch (error) {
      this.logger.error("Failed to initialize grid", error);
      return R.fail('initialization_failed');
    }
  }

  /** Checks if the grid has been initialized. */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Gets the start pipe (the source of water flow).
   * @throws {Error} if grid is not initialized
   */
  get startPipe(): Pipe {
    if (!this._startPipe) {
      throw new Error("Grid has not been initialized. Call initialize() first.");
    }
    return this._startPipe;
  }

  /** Safely gets the start pipe, returning null if not initialized. */
  tryGetStartPipe(): Pipe | null {
    return this._startPipe;
  }

  // ============================================================================
  // Cell Access
  // ============================================================================

  /**
   * Returns the GridCell for a given position.
   * @throws {Error} if position is out of bounds
   */
  getCell(pos: GridPosition): GridCell {
    // GridPosition guarantees validity, but double-check for safety
    if (!this.isValidPosition(pos.x, pos.y)) {
      throw new Error(`Position ${pos} is out of bounds`);
    }
    return this.cells[pos.y][pos.x];
  }

  /** Safe version: returns null if position is invalid. */
  tryGetCell(pos: GridPosition): GridCell | null {
    return this.isValidPosition(pos.x, pos.y) ? this.cells[pos.y][pos.x] : null;
  }

  /**
   * Returns the neighboring cell in the given direction.
   * Returns null if out of bounds.
   */
  getNeighbor(pos: GridPosition, direction: Direction): GridCell | null {
    const neighborPos = pos.move(direction, this.width, this.height);
    return neighborPos ? this.getCell(neighborPos) : null;
  }

  /** Returns the neighboring cell if it's valid (not blocked, in bounds). */
  getValidNeighbor(pos: GridPosition, direction: Direction): GridCell | null {
    const neighbor = this.getNeighbor(pos, direction);
    return neighbor && !neighbor.isBlocked ? neighbor : null;
  }

  /** Checks if coordinates are within grid bounds. */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  // ============================================================================
  // Pipe Operations
  // ============================================================================

  /**
   * Places a pipe in the specified cell.
   * @returns Result indicating success or failure with reason
   */
  setPipe(cell: GridCell, pipe: Pipe): Result<void, 'cell_blocked' | 'position_mismatch' | "cell_occupied"> {
    if (cell.isBlocked) {
      return R.fail('cell_blocked');
    }
    if (!cell.position.equals(pipe.position)) {
      return R.fail('position_mismatch');
    }

    if (cell.hasPipe) {
      return R.fail('cell_occupied');
    }

    try {
      cell.setPipe(pipe);
      this.logger.debug(`Placed ${pipe.shape.id} at ${cell.position} facing ${pipe.direction}`);
      return R.ok(undefined);
    } catch (error) {
      this.logger.error("Failed to set pipe", error);
      return R.fail('cell_blocked');
    }
  }

  /** Removes the pipe from the specified cell. */
  removePipe(cell: GridCell): void {
    if (cell.isEmpty || cell.isBlocked) {
      return;
    }
    
    const pipe = cell.pipe!;
    cell.clearPipe();
    this.logger.debug(`Removed ${pipe.shape.id} from ${cell.position}`);
  }

  /** Removes pipe at the given position (convenience method). */
  removePipeAt(pos: GridPosition): void {
    const cell = this.tryGetCell(pos);
    if (cell) {
      this.removePipe(cell);
    }
  }

  /** Blocks a cell so no pipe can be placed there. */
  blockCell(cell: GridCell): void {
    if (!cell.isEmpty) {
      this.logger.warn(
        `Cannot block cell ${cell.position} - contains pipe`
      );
      return;
    }
    cell.block();
    this.logger.debug(`Cell ${cell.position} marked as blocked`);
  }

  // ============================================================================
  // Network Analysis
  // ============================================================================

  /** Checks if a pipe is connected to the network (has valid neighbors). */
  isConnectedToNetwork(pipe: Pipe): boolean {
    return this.getConnectedNeighbors(pipe).length > 0;
  }

  /** Returns all pipes connected to the given pipe. */
  getConnectedNeighbors(pipe: Pipe): Pipe[] {
    const neighbors: Pipe[] = [];
    
    for (const dir of pipe.openPorts) {
      const neighborCell = this.getValidNeighbor(pipe.position, dir);
      if (!neighborCell?.hasPipe) continue;

      const neighborPipe = neighborCell.pipe!;
      if (neighborPipe.hasOpenPort(dir.opposite)) {
        neighbors.push(neighborPipe);
      }
    }

    return neighbors;
  }

  /** Gets the pipe at a specific position, if any. */
  getPipeAt(pos: GridPosition): Pipe | null {
    return this.tryGetCell(pos)?.pipe ?? null;
  }

  /** Gets the neighboring pipe in the given direction from a position. */
  getNeighborPipe(pos: GridPosition, direction: Direction): Pipe | null {
    const neighborCell = this.getNeighbor(pos, direction);
    return neighborCell?.pipe ?? null;
  }

  // ============================================================================
  // Grid Iteration
  // ============================================================================

  /** Executes a callback for each cell in the grid. */
  forEachCell(callback: (cell: GridCell) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        callback(this.cells[y][x]);
      }
    }
  }

  /** Returns all cells matching a predicate. */
  findCells(predicate: (cell: GridCell) => boolean): GridCell[] {
    const results: GridCell[] = [];
    this.forEachCell(cell => {
      if (predicate(cell)) results.push(cell);
    });
    return results;
  }

  /** Returns all empty cells (not blocked, no pipe). */
  getEmptyCells(): GridCell[] {
    return this.findCells(cell => cell.isEmpty);
  }

  /** Returns all cells with pipes. */
  getCellsWithPipes(): GridCell[] {
    return this.findCells(cell => cell.hasPipe);
  }

  // ============================================================================
  // Grid Management
  // ============================================================================

  /**
   * Clears all pipes from the grid except the start pipe.
   */
  clear(): void {
    this.forEachCell(cell => {
      if (cell.pipe !== this._startPipe) {
        cell.clearPipe();
      }
    });
    this.logger.info("Grid cleared (start pipe preserved)");
  }

  /**
   * Resets the grid to its initial state.
   */
  reset(): void {
    this._startPipe = null;
    this._initialized = false;
    
    this.forEachCell(cell => {
      cell.clearPipe();
      cell.unblock();
    });
    
    this.logger.info("Grid reset to uninitialized state");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  /** Creates the 2D grid of cells. */
  private initializeGrid(): GridCell[][] {
    const cells: GridCell[][] = [];
    
    for (let y = 0; y < this.height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < this.width; x++) {
        const pos = GridPosition.createUnsafe(x, y);
        row.push(new GridCell(pos));
      }
      cells.push(row);
    }
    
    return cells;
  }

  /** Creates the start pipe at a random valid location. */
  private createStartPipe(): Result<Pipe, 'no_valid_start_position'> {
    const validCells: { cell: GridCell; directions: Direction[] }[] = [];

    // Find all empty cells that have at least one valid direction
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (!cell.isEmpty) continue;

        const validDirs = Direction.All.filter(dir => this.getValidNeighbor(cell.position, dir) !== null);
        if (validDirs.length > 0) {
          validCells.push({ cell, directions: validDirs });
        }
      }
    }

    if (validCells.length === 0) {
      this.logger.error("No valid start position found (empty cell with valid direction)");
      return R.fail('no_valid_start_position');
    }

    // Pick a random valid cell
    const index = Math.floor(Math.random() * validCells.length);
    const { cell, directions } = validCells[index];

    // Pick a random valid direction from the available directions
    const dirIndex = Math.floor(Math.random() * directions.length);
    const direction = directions[dirIndex];

    const startPipe = new Pipe(cell.position, PipeShapes[PipeType.Start], direction);
    const setResult = this.setPipe(cell, startPipe);
    if (!setResult.success) {
      this.logger.error("Failed to place start pipe despite having a valid cell/direction");
      return R.fail('no_valid_start_position');
    }

    this.logger.info(`Start pipe placed at ${cell.position} facing ${startPipe.direction}`);
    return R.ok(startPipe);
  }

  /** Blocks random cells based on difficulty percentage. */
  private blockRandomCells(percentage: number, protectedPositions: GridPosition[] = []): void {
    if (percentage <= 0) return;

    const totalCells = this.width * this.height;
    const cellsToBlock = Math.floor((percentage / 100) * totalCells);
    const available = this.getEmptyCells().filter(cell => 
      !protectedPositions.some(pos => pos.equals(cell.position))
    );

    for (let i = 0; i < cellsToBlock && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      const [cell] = available.splice(index, 1);
      cell.block();
    }

    this.logger.info(`Blocked ${cellsToBlock} cells (${percentage}%) for difficulty`);
  }

  // ============================================================================
  // Debugging
  // ============================================================================

  /** Returns grid dimensions. */
  get dimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /** Returns statistics about the current grid state. */
  getStats(): GridStats {
    let blockedCount = 0;
    let pipeCount = 0;
    let emptyCount = 0;

    this.forEachCell(cell => {
      if (cell.isBlocked) blockedCount++;
      else if (cell.hasPipe) pipeCount++;
      else emptyCount++;
    });

    return {
      totalCells: this.width * this.height,
      blockedCells: blockedCount,
      pipesPlaced: pipeCount,
      emptyCells: emptyCount,
      isInitialized: this._initialized,
    };
  }
}

interface GridStats {
  readonly totalCells: number;
  readonly blockedCells: number;
  readonly pipesPlaced: number;
  readonly emptyCells: number;
  readonly isInitialized: boolean;
}