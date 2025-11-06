import type { Logger } from "../utils/Logger";
import { Direction, Pipe, PipeType } from "./Pipe";
import { GridCell } from "./GridCell";

/**
 * Represents the game grid that manages pipe placement and validation.
 * Encapsulates all grid-related logic including initialization and validation.
 */
export class Grid {
  private readonly cells: ReadonlyArray<ReadonlyArray<GridCell>>;
  private _startPipe: Pipe | null = null;

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly logger: Logger
  ) {
    this.validateDimensions(width, height);
    this.cells = this.initializeGrid();
    this.logger.info(`Grid initialized with dimensions ${width}x${height}`);
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

    this._startPipe = this.createStartPipe();
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
   * @throws {Error} if position is invalid
   */
  setPipe(x: number, y: number, pipe: Pipe): void {
    this.validatePosition(x, y);
    (this.cells[y][x] as GridCell).setPipe(pipe);
    this.logger.debug(`Placed ${pipe.type} pipe at (${x}, ${y}) with rotation ${pipe.rotation}°`);
  }

  /**
   * Removes a pipe from the specified coordinates.
   * No-op if position is invalid or already empty.
   */
  removePipe(x: number, y: number): void {
    if (this.isValidPosition(x, y)) {
      (this.cells[y][x] as GridCell).clearPipe();
      this.logger.debug(`Removed pipe from (${x}, ${y})`);
    }
  }

  /**
   * Checks if the given coordinates are within grid boundaries.
   */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * Clears all pipes from the grid, excluding the start pipe.
   */
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

  /**
   * Outputs a visual representation of the grid to the logger.
   * Useful for debugging grid state.
   */
  debugPrint(): void {
    const visualization = this.generateGridVisualization();
    this.logger.debug(`\nGrid State:\n${visualization}`);
  }

  // Private Methods

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
    const rotation = this.selectValidStartRotation(cell);
    const startPipe = new Pipe(PipeType.Start, cell, rotation);
    
    this.setPipe(cell.x, cell.y, startPipe);
    this.logger.info(`Start pipe created at (${cell.x}, ${cell.y}) with rotation ${rotation}°`);
    
    return startPipe;
  }

  private selectRandomEmptyCell(): GridCell {
    const emptyCells = this.getEmptyCells();
    
    if (emptyCells.length === 0) {
      throw new Error("No empty cells available in the grid");
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }

  private getEmptyCells(): GridCell[] {
    const emptyCells: GridCell[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        emptyCells.push(this.cells[y][x]);
      }
    }
    
    return emptyCells;
  }

  private selectValidStartRotation(cell: GridCell): number {
    const validRotations = this.getValidRotationsForCell(cell);
    
    if (validRotations.length === 0) {
      // Fallback for edge case (single cell grid)
      this.logger.warn(`No valid rotations found for cell (${cell.x}, ${cell.y}). Using default.`);
      return 0;
    }

    const randomIndex = Math.floor(Math.random() * validRotations.length);
    return validRotations[randomIndex];
  }

  private getValidRotationsForCell(cell: GridCell): number[] {
    const rotations = [0, 90, 180, 270] as const;
    
    return rotations.filter(rotation => {
      const direction = this.rotationToDirection(rotation);
      const { x: nextX, y: nextY } = this.getNeighborCoordinates(cell, direction);
      return this.isValidPosition(nextX, nextY);
    });
  }

  private rotationToDirection(rotation: number): Direction {
    const normalized = rotation % 360;
    const directionMap: Record<number, Direction> = {
      0: Direction.Right,
      90: Direction.Down,
      180: Direction.Left,
      270: Direction.Up,
    };
    
    return directionMap[normalized] ?? Direction.Right;
  }

  private getNeighborCoordinates(
    cell: GridCell,
    direction: Direction
  ): { x: number; y: number } {
    const offsets: Record<Direction, { x: number; y: number }> = {
      [Direction.Right]: { x: 1, y: 0 },
      [Direction.Left]: { x: -1, y: 0 },
      [Direction.Down]: { x: 0, y: 1 },
      [Direction.Up]: { x: 0, y: -1 },
    };

    const offset = offsets[direction];
    return { x: cell.x + offset.x, y: cell.y + offset.y };
  }

  private generateGridVisualization(): string {
    const pipeSymbols: Record<PipeType, string> = {
      [PipeType.Start]: "S",
      [PipeType.Curve]: "L",
      [PipeType.Straight]: "—",
      [PipeType.Cross]: "+",
    };

    return this.cells
      .map(row =>
        row
          .map(cell => cell.pipe ? (pipeSymbols[cell.pipe.type] ?? "?") : "·")
          .join(" ")
      )
      .join("\n");
  }
}