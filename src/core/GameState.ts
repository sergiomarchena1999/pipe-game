import { EventEmitter } from "eventemitter3";
import type { GridPosition } from "./domain/grid/GridPosition";
import type { IGameConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";
import type { PlacePipeError, Result } from "./ResultTypes";

import { ScoreController } from "./ScoreController";
import { BombController } from "./BombController";
import { FlowNetwork } from "./domain/flow/FlowNetwork";
import { Result as R } from "./ResultTypes";
import { PipeQueue } from "./domain/pipe/PipeQueue";
import { Pipe } from "./domain/pipe/Pipe";
import { Grid } from "./domain/grid/Grid";


type PlacePipeResult = Result<Pipe, PlacePipeError>;

interface GameStateEvents {
  onInitialized: (grid: Grid) => void;
  onStopped: () => void;
  onBombStarted: (pos: GridPosition, durationMs: number) => void;
  onBombCompleted: (newPipe: Pipe) => void;
  onScoreUpdated: (score: number, pipesFlowed: number) => void;
  onGameWon: (finalScore: number, pipesFlowed: number) => void;
  onGameLost: (finalScore: number, pipesFlowed: number, reason: string) => void;
}

/**
 * Central state manager for the game.
 * This is the aggregate root - all game operations go through here.
 */
export class GameState extends EventEmitter<GameStateEvents> {
  private readonly _grid: Grid;
  private readonly _queue: PipeQueue;
  private readonly _score: ScoreController;
  private readonly _flowNetwork: FlowNetwork;
  private readonly _bombController: BombController;
  private _initialized = false;
  private _currentTime = 0;

  constructor(
    private readonly config: IGameConfig,
    public readonly logger: ILogger
  ) {
    super();

    // Create queue and grid immediately
    this._queue = new PipeQueue(this.logger, this.config.queue);
    this._grid = new Grid(this.config.grid, this.logger);
    this._flowNetwork = new FlowNetwork(this._grid, logger);
    this._score = new ScoreController(this.config.score, this.logger);
    
    // Create bomb controller with event callbacks
    this._bombController = new BombController(
      this._grid,
      this._queue,
      this.logger,
      this.config.bomb,
      {
        onBombStarted: (pos, durationMs) => this.emit("onBombStarted", pos, durationMs),
        onBombCompleted: (newPipe) => this.emit("onBombCompleted", newPipe)
      }
    );

    // Wire up flow network events to score controller
    this._flowNetwork.on("onPipeFlowed", (pipe) => {
      this._score.onPipeFlowed(pipe);
    });

    this._flowNetwork.on("onFlowStuck", () => {
      this._score.onFlowStuck();
    });

    this._flowNetwork.on("onNoPathAvailable", () => {
      this._score.onNoPathAvailable();
    });

    // Wire up score controller events to game state
    this._score.on("onScoreUpdated", (score, pipesFlowed) => {
      this.emit("onScoreUpdated", score, pipesFlowed);
    });

    this._score.on("onWin", (finalScore, pipesFlowed) => {
      this.logger.info(`GAME WON! Score: ${finalScore}, Pipes: ${pipesFlowed}`);
      this.emit("onGameWon", finalScore, pipesFlowed);
    });

    this._score.on("onLose", (finalScore, pipesFlowed, reason) => {
      this.logger.info(`GAME LOST (${reason})! Score: ${finalScore}, Pipes: ${pipesFlowed}`);
      this.emit("onGameLost", finalScore, pipesFlowed, reason);
    });

    this.logger.debug("GameState constructed — grid and queue created.");
  }

  // ============================================================================
  // Public API - State Access
  // ============================================================================

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

  /** Gets the flow network. */
  get flowNetwork(): FlowNetwork {
    return this._flowNetwork;
  }

  // ============================================================================
  // Public API - Game Lifecycle
  // ============================================================================

  /**
   * Initializes the game state (fills grid, prepares queue, starts flow).
   * Must be called before game can be played.
   */
  start(): Result<void, 'already_initialized' | 'grid_initialization_failed'> {
    if (this._initialized) {
      this.logger.warn("GameState already initialized");
      return R.fail('already_initialized');
    }

    try {
      // Initialize grid first
      const gridResult = this._grid.initialize();
      if (!gridResult.success) {
        this.logger.error("Failed to initialize grid");
        return R.fail('grid_initialization_failed');
      }

      // Initialize flow with delay
      this._flowNetwork.initialize(this.config.flow.startDelaySeconds);

      // Mark as ready
      this._initialized = true;

      // Notify listeners
      this.emit("onInitialized", this._grid);
      this.logger.info(`GameState started successfully (${this.config.difficulty} difficulty)`);

      return R.ok(undefined);
    } catch (error) {
      this.logger.error("Failed to start GameState", error);
      return R.fail('grid_initialization_failed');
    }
  }

  /**
   * Updates the game state (called every frame).
   * @param deltaTime Time elapsed in seconds since last update
   */
  update(deltaTime: number): void {
    // Don't update if game has ended
    if (this._score.gameEnded) {
      return;
    }

    this._currentTime += deltaTime;
    this._bombController.update(this._currentTime);
    this._flowNetwork.update(deltaTime, this.config.flow.pipeFlowSpeed);
  }

  /** Stops the game and cleans up state. */
  stop(): Result<void, 'not_initialized'> {
    if (!this._initialized) {
      this.logger.warn("GameState not initialized — nothing to stop");
      return R.fail('not_initialized');
    }

    this._bombController.cancelAll();
    this._flowNetwork.clear();
    this.emit("onStopped");
    
    this._initialized = false;
    this._currentTime = 0;
    
    this.logger.info("GameState stopped");
    return R.ok(undefined);
  }

  /** Resets the game to initial state without destroying it. */
  reset(): void {
    this._bombController.cancelAll();
    this._flowNetwork.clear();
    this._score.reset();
    this._queue.reset();
    this._grid.reset();
    
    this._initialized = false;
    this._currentTime = 0;
    
    this.logger.info("GameState reset");
  }

  /** Destroys the game state and releases resources. */
  destroy(): void {
    this.stop();
    
    // Clean up event listeners
    this._flowNetwork.removeAllListeners();
    this._score.removeAllListeners();
    this.removeAllListeners();
    
    this.logger.info("GameState destroyed");
  }

  // ============================================================================
  // Public API - Game Actions
  // ============================================================================

  /**
   * Places the next queued pipe at the given grid position.
   * Returns explicit Result type indicating success or specific failure reason.
   * 
   * If cell already has a pipe, attempts to start a bomb instead.
   */
  placeNextPipe(pos: GridPosition): PlacePipeResult {
    // Validate: game must be initialized
    if (!this._initialized) {
      this.logger.warn("Cannot place pipe — game not initialized");
      return R.fail('game_not_initialized');
    }

    // Validate: game must not be ended
    if (this._score.gameEnded) {
      this.logger.warn("Cannot place pipe — game has ended");
      return R.fail('game_not_initialized');
    }

    // Validate: position must be valid
    const cell = this._grid.tryGetCell(pos);
    if (!cell) {
      this.logger.debug(`Invalid position: ${pos}`);
      return R.fail('invalid_position');
    }

    // Validate: cell must not be blocked
    if (cell.isBlocked) {
      this.logger.debug(`Cannot place pipe — cell ${pos} is blocked`);
      return R.fail('cell_blocked');
    }

    // If cell has a pipe, try to bomb it instead
    if (cell.hasPipe) {
      const existingPipe = cell.pipe!;
      const bombResult = this._bombController.startBomb(existingPipe, this._currentTime);
      if (bombResult.success) {
        return R.fail('bomb_started');
      } else {
        // Bomb couldn't start (blocked, max reached, etc.)
        return R.fail('cell_occupied');
      }
    }

    // Place new pipe
    try {
      const queued = this._queue.dequeue();
      const pipe = new Pipe(cell.position, queued.shape, queued.direction);
      
      const setResult = this._grid.setPipe(cell, pipe);
      if (!setResult.success) {
        this.logger.error(`Failed to set pipe: ${setResult.error}`);
        return R.fail('cell_blocked');
      }

      this.logger.info(`Placed ${queued.shape.id} at ${cell.position} [${queued.direction}]`);

      // Invalidate path cache since grid changed
      this._flowNetwork.invalidatePathCache(pipe);

      return R.ok(pipe);
    } catch (error) {
      this.logger.error("Failed to place next pipe", error);
      return R.fail('cell_blocked');
    }
  }
}