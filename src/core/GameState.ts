import { EventEmitter } from "eventemitter3";
import type { IGameConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";

import { ScoreController } from "./ScoreController";
import { BombController } from "./BombController";
import { FlowNetwork } from "./domain/flow/FlowNetwork";
import { PipeQueue } from "./domain/pipe/PipeQueue";
import { Pipe } from "./domain/pipe/Pipe";
import { Grid } from "./domain/grid/Grid";
import type { GridPosition } from "./domain/grid/GridPosition";

interface GameStateEvents {
  initialized: (grid: Grid) => void;
  stopped: () => void;
  bombStarted: (pos: GridPosition, durationMs: number) => void;
  bombCompleted: (newPipe: Pipe) => void;
}

/**
 * Central state manager for the game.
 * Emits events for state changes that other systems can subscribe to.
 */
export class GameState extends EventEmitter<GameStateEvents> {
  private readonly _grid: Grid;
  private readonly _queue: PipeQueue;
  private readonly _score: ScoreController;
  private readonly _flowNetowrk: FlowNetwork;
  private readonly _bombController: BombController;
  private isInitialized = false;
  private currentTime: number = 0;

  constructor(
    private readonly config: IGameConfig,
    public readonly logger: ILogger
  ) {
    super();

    // Create queue and grid immediately
    this._queue = new PipeQueue(this.logger, this.config.pipeWeights, this.config.queueSize);
    this._grid = new Grid(this.config.grid, this.logger);
    this._flowNetowrk = new FlowNetwork(this._grid, logger);
    this._score = new ScoreController(
      this.config.grid.width, 
      this.config.grid.height, 
      this._grid, 
      this.logger
    );
    
    // Create bomb controller with event callbacks
    this._bombController = new BombController(
      this._grid,
      this._queue,
      this.logger,
      this.config.bombConfig,
      {
        onBombStarted: (pos, durationMs) => this.emit("bombStarted", pos, durationMs),
        onBombCompleted: (newPipe) => this.emit("bombCompleted", newPipe)
      }
    );

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
  get scoreController(): ScoreController {
    return this._score;
  }

  /** Gets the bomb controller. */
  get bombController(): BombController {
    return this._bombController;
  }

  /** Gets the bomb controller. */
  get flowNetwork(): FlowNetwork {
    return this._flowNetowrk;
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
      this._flowNetowrk.initialize(this.config.flowStartDelaySeconds);
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
    this.currentTime += deltaTime;
    this._bombController.update(this.currentTime);
    this._flowNetowrk.update(deltaTime, this.config.pipeFlowSpeed);
  }

  /** Stops the game state and notifies listeners. */
  stop(): void {
    if (!this.isInitialized) {
      this.logger.warn("GameState not initialized. Nothing to stop.");
      return;
    }

    this._bombController.cancelAll();
    this.emit("stopped");
    this.isInitialized = false;
    this.logger.info("GameState stopped");
  }

  /**
   * Places the next queued pipe at the given grid coordinates.
   * If a pipe exists, starts a bomb animation instead.
   * Returns the created Pipe, or null if placement was invalid or bomb was started.
   */
  placeNextPipe(pos: GridPosition): Pipe | null {
    if (!this.isInitialized) {
      this.logger.warn("GameState not initialized. Ignoring placeNextPipe.");
      return null;
    }

    // Validate placement
    const cell = this._grid.tryGetCell(pos);
    if (!cell || cell.blocked) {
      this.logger.debug(`Cannot place pipe at ${pos}`);
      return null;
    }

    // If cell has a pipe, start bomb animation
    const existingPipe = cell.pipe;
    if (existingPipe) {
      this._bombController.startBomb(existingPipe, this.currentTime);
      return null; // Return null whether bomb started or not
    }

    // Place new pipe
    try {
      const queued = this._queue.dequeue();
      const pipe = new Pipe(cell.position, queued.shape, queued.direction);
      this._grid.setPipe(cell, pipe);

      this.logger.info(`Placed pipe ${queued.shape.id} at ${cell} dir=${queued.direction}`);
      if (this._grid.isConnectedToNetwork(pipe)) {
        this._score.updateScore();
      }

      return pipe;
    } catch (err) {
      this.logger.error("Failed to place next pipe", err);
      return null;
    }
  }
}