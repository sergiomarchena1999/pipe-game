import type { IGridConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../logging/ILogger";

import { PipeShapes, PipeType } from "../../constants/PipeShapes";
import { GridPosition } from "./GridPosition";
import { Direction } from "../Direction";
import { GridCell } from "./GridCell";
import { Pipe } from "../pipe/Pipe";

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

  get startPipe(): Pipe {
    if (!this._startPipe) throw new Error("Grid has not been initialized. Call initialize() first.");
    return this._startPipe;
  }

  initialize(): void {
    if (this._startPipe) {
      this.logger.warn("Grid already initialized. Skipping re-initialization.");
      return;
    }

    this.blockRandomCells(this.config.blockedPercentage);
    this._startPipe = this.createStartPipe();
  }

  /** Returns the GridCell for a given GridPosition */
  getCell(pos: GridPosition): GridCell {
    return this.cells[pos.y][pos.x];
  }

  /** Safe version: returns null if position is invalid (should be impossible with typed GridPosition) */
  tryGetCell(pos: GridPosition): GridCell | null {
    return this.isValidPosition(pos.x, pos.y) ? this.cells[pos.y][pos.x] : null;
  }

  /** Returns the neighboring cell in the given direction, or null if out of bounds or blocked */
  getNeighbor(pos: GridPosition, direction: Direction): GridCell | null {
    const nx = pos.x + direction.dx;
    const ny = pos.y + direction.dy;
    
    // Use the factory to validate - it returns null if invalid
    const neighborPos = GridPosition.create(nx, ny, this.width, this.height);
    if (!neighborPos) return null;
    
    return this.getCell(neighborPos);
  }

  getValidNeighbor(pos: GridPosition, direction: Direction): GridCell | null {
    const neighbor = this.getNeighbor(pos, direction);
    return neighbor && !neighbor.blocked ? neighbor : null;
  }

  isCellEmpty(cell: GridCell): boolean {
    return !cell.blocked && cell.isEmpty();
  }

  setPipe(cell: GridCell, pipe: Pipe): void {
    if (cell.blocked) throw new Error(`Cannot set pipe on blocked cell ${cell.position}`);
    cell.pipe = pipe;
    this.logger.debug(`Placed ${pipe} at ${cell.position} facing ${pipe.direction}`);
  }

  removePipe(cell: GridCell): void {
    if (cell.isEmpty() || cell.blocked) return;
    cell.clearPipe();
    this.logger.debug(`Removed pipe from ${cell.position}`);
  }

  blockCell(cell: GridCell): void {
    if (!cell.isEmpty()) return;
    cell.block();
    this.logger.debug(`Cell ${cell.position} marked as blocked`);
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isConnectedToNetwork(pipe: Pipe): boolean {
    return this.getConnectedNeighbors(pipe).length > 0;
  }

  getConnectedNeighbors(pipe: Pipe): Pipe[] {
    const neighbors: Pipe[] = [];
    for (const dir of pipe.openPorts) {
      const neighborCell = this.getValidNeighbor(pipe.position, dir);
      if (!neighborCell) continue;

      const neighborPipe = neighborCell.pipe;
      if (!neighborPipe) continue;

      if (neighborPipe.hasOpenPort(dir.opposite)) neighbors.push(neighborPipe);
    }

    return neighbors;
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell.pipe !== this._startPipe) cell.clearPipe();
      }
    }
    this.logger.info("Grid cleared (start pipe preserved)");
  }

  /** Initializes all cells using type-safe GridPosition */
  private initializeGrid(): GridCell[][] {
    const cells: GridCell[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < this.width; x++) {
        const pos = GridPosition.create(x, y, this.width, this.height)!; // always valid
        row.push(new GridCell(pos));
      }
      cells.push(row);
    }
    return cells;
  }

  private createStartPipe(): Pipe {
    const cell = this.selectRandomEmptyCell(this.config.allowStartPipeOnEdge);
    const direction = this.selectValidStartDirection(cell);
    const startPipe = new Pipe(cell.position, PipeShapes[PipeType.Start], direction);
    this.setPipe(cell, startPipe);
    return startPipe;
  }

  private selectRandomEmptyCell(allowEdges: boolean): GridCell {
    const emptyCells: GridCell[] = [];

    for (let y = allowEdges ? 0 : 1; y < (allowEdges ? this.height : this.height - 1); y++) {
      for (let x = allowEdges ? 0 : 1; x < (allowEdges ? this.width : this.width - 1); x++) {
        const cell = this.cells[y][x];
        if (!cell.blocked && cell.isEmpty()) emptyCells.push(cell);
      }
    }

    if (emptyCells.length === 0) throw new Error("No empty cells available in the grid");
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  private blockRandomCells(percentage: number): void {
    if (percentage <= 0) return;

    const totalCells = this.width * this.height;
    const cellsToBlock = Math.floor((percentage / 100) * totalCells);
    const available: GridCell[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (this.isCellEmpty(cell)) available.push(cell);
      }
    }

    for (let i = 0; i < cellsToBlock && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      const [cell] = available.splice(index, 1);
      cell.block();
    }

    this.logger.info(`Blocked ${cellsToBlock} cells (${percentage}%) for difficulty`);
  }

  private selectValidStartDirection(cell: GridCell): Direction {
    const validDirections = Direction.All.filter(dir => {
      return this.getValidNeighbor(cell.position, dir) !== null;
    });

    if (validDirections.length === 0) throw new Error(`No valid start directions for ${cell.position}`);
    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }
}