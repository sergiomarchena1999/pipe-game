import { EventEmitter } from "eventemitter3";
import type { IGameConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";

import { ScoreController } from "./ScoreController";
import { FlowNetwork } from "./FlowNetwork";
import { PipeQueue } from "./PipeQueue";
import { Pipe } from "./Pipe";
import { Grid } from "./Grid";


interface GameStateEvents {
  initialized: (grid: Grid) => void;
  stopped: () => void;
}

/**
 * Central state manager for the game.
 * Emits events for state changes that other systems can subscribe to.
 */
export class GameState extends EventEmitter<GameStateEvents> {
  private readonly _grid: Grid;
  private readonly _queue: PipeQueue;
  private readonly _score: ScoreController;
  private isInitialized = false;

  constructor(
    private readonly config: IGameConfig,
    public readonly logger: ILogger
  ) {
    super();

    // Create queue and grid immediately
    this._queue = new PipeQueue(this.logger, this.config.pipeWeights, this.config.queueSize);
    this._grid = new Grid(this.config, this.logger);
    this._score = new ScoreController(this.config.grid.width, this.config.grid.height, this._grid, this.logger);

    this.logger.debug("GameState constructed — grid and queue created.");
  }

  /** Gets the game grid. */
  get grid(): Grid {
    return this._grid;
  }

  /** Gets the pipe queue. */
  get queue(): PipeQueue {
    return this._queue;
  }
  
  /** Gets the score controller. */
  get score(): ScoreController {
    return this._score;
  }

  /**
   * Initializes the game state (e.g., fills grid and prepares queue).
   * @throws {Error} if already initialized
   */
  start(): void {
    if (this.isInitialized) {
      throw new Error("GameState already initialized");
    }

    try {
      this._grid.initialize();
      FlowNetwork.initialize(this._grid, this.logger, this.config.flowStartDelaySeconds);
      this.isInitialized = true;

      this.emit("initialized", this._grid);

      this.logger.info("GameState started successfully");
    } catch (error) {
      this.logger.error("Failed to start GameState", error);
      throw error;
    }
  }

  /** Updates the game state (called every frame). */
  update(deltaTime: number): void {
    FlowNetwork.update(deltaTime, this.config.pipeFlowSpeed, this._grid, this.logger);
  }

  /** Stops the game state and notifies listeners. */
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
   */
  placeNextPipe(x: number, y: number): Pipe | null {
    if (!this.isInitialized) {
      this.logger.warn("GameState not initialized. Ignoring placeNextPipe.");
      return null;
    }

    // Validate placement
    if (!this._grid.isValidPosition(x, y) || !this._grid.isCellEmpty(x, y)) {
      this.logger.debug(`Cannot place pipe at (${x}, ${y})`);
      return null;
    }

    try {
      const queued = this._queue.dequeue();
      const cell = this._grid.getCell(x, y);
      const pipe = new Pipe(cell, queued.shape, queued.direction);
      this._grid.setPipe(cell, pipe);

      this.logger.info(`Placed pipe ${queued.shape.id} at (${x}, ${y}) dir=${queued.direction}`);
      if (this._grid.isConnectedToNetwork(pipe)) {
        this._score.updateScore();
      }

      return pipe;
    } catch (err) {
      this.logger.error("Failed to place next pipe", err);
      return null;
    }
  }

  /** Outputs a debug summary of the current game state. */
  debugSummary(): void {
    const queueContents = this._queue.contents
      .map(p => `${p.shape.id}(${p.direction})`)
      .join(", ");
    this.logger.debug(`Pipe Queue: [${queueContents}]`);
  }
}