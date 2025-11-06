import { EventEmitter } from "eventemitter3";
import type { ILogger } from "./logging/ILogger";
import { PipeQueue } from "./PipeQueue";
import { Pipe } from "./Pipe";
import { Grid } from "./Grid";


interface GameStateEvents {
  initialized: [Grid];
  stopped: [];
}

/**
 * Central state manager for the game.
 * Emits events for state changes that other systems can subscribe to.
 * Maintains separation between game logic and rendering.
 */
export class GameState extends EventEmitter<GameStateEvents> {
  private _grid: Grid | null = null;
  private _queue: PipeQueue | null = null;
  private isInitialized: boolean = false;

  constructor(
    private readonly gridWidth: number,
    private readonly gridHeight: number,
    public readonly logger: ILogger
  ) {
    super();
    this.validateDimensions();
  }

  /**
   * Gets the game grid.
   * @throws {Error} if accessed before initialization
   */
  get grid(): Grid {
    if (!this._grid) {
      throw new Error("GameState not initialized. Call start() first.");
    }
    return this._grid;
  }

  /**
   * Gets the pipe queue.
   * @throws {Error} if accessed before initialization
   */
  get queue(): PipeQueue {
    if (!this._queue) throw new Error("PipeQueue not initialized. Call start() first.");
    return this._queue;
  }

  /**
   * Initializes the game state and creates the grid.
   * @throws {Error} if already initialized or if grid creation fails
   */
  start(): void {
    if (this.isInitialized) {
      throw new Error("GameState already initialized");
    }

    try {
      this._queue = new PipeQueue(this.logger, 5);
      this._grid = new Grid(this.gridWidth, this.gridHeight, this.logger);
      this._grid.initialize();
      this.isInitialized = true;
      
      this.logger.info("GameState started successfully");
    } catch (error) {
      this.logger.error("Failed to start GameState", error);
      throw error;
    }
  }

  /**
   * Stops the game state and notifies listeners.
   */
  stop(): void {
    if (!this.isInitialized) {
      this.logger.warn("GameState not initialized. Nothing to stop.");
      return;
    }

    this.emit("stopped");
    this.isInitialized = false;
    this.logger.info("GameState stopped");
  }

  /**
   * Places the next queued pipe at the given grid coordinates.
   * Returns the created Pipe, or null if placement was invalid.
   *
   * This centralizes placement logic in GameState so rendering code only
   * needs to display the returned Pipe.
   */
  placeNextPipe(x: number, y: number): Pipe | null {
    if (!this.isInitialized) {
      this.logger.warn("GameState not initialized. Ignoring placeNextPipe.");
      return null;
    }

    if (!this._grid) {
      this.logger.error("Grid missing in GameState while placing pipe");
      return null;
    }

    // Validate bounds
    if (!this._grid.isValidPosition(x, y)) {
      this.logger.debug(`Attempt to place pipe out of bounds: (${x}, ${y})`);
      return null;
    }

    // Validate emptiness
    if (!this._grid.isCellEmpty(x, y)) {
      this.logger.debug(`Attempt to place pipe in non-empty cell: (${x}, ${y})`);
      return null;
    }

    try {
      const queued = this._queue!.dequeue();
      const cell = this._grid.getCell(x, y);
      const pipe = new Pipe(queued.type, cell, queued.direction);
      this._grid.setPipe(x, y, pipe);

      this.logger.info(`Placed pipe ${queued.type} at (${x}, ${y}) dir=${queued.direction}`);
      return pipe;
    } catch (err) {
      this.logger.error("Failed to place next pipe", err);
      return null;
    }
  }

  /**
   * Outputs a debug summary of the current game state.
   * Safe to call even if not initialized.
   */
  debugSummary(): void {
    if (!this._grid) {
      this.logger.debug("GameState not initialized - no grid to display");
      return;
    }

    if (this._queue) {
      const queueContents = this._queue.contents
        .map(p => `${p.type}(${p.direction})`)
        .join(", ");
      this.logger.debug(`Pipe Queue: [${queueContents}]`);
    } else {
      this.logger.debug("Pipe Queue not initialized");
    }
  }

  private validateDimensions(): void {
    if (this.gridWidth <= 0 || this.gridHeight <= 0) {
      throw new Error(`Invalid grid dimensions: ${this.gridWidth}x${this.gridHeight}`);
    }
  }
}