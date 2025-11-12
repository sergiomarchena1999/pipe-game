import type { IBombConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";
import type { BombError, Result } from "./ResultTypes";
import type { GridPosition } from "./domain/grid/GridPosition";
import type { PipeQueue } from "./domain/pipe/PipeQueue";
import type { PipeBase } from "./domain/pipe/PipeBase";
import type { Grid } from "./domain/grid/Grid";

import { Result as R } from "./ResultTypes";
import { Pipe } from "./domain/pipe/Pipe";


/** Information about an active bomb. */
interface BombInfo {
  readonly pipe: Pipe;
  readonly startTime: number;
  readonly replacementPipe: PipeBase;
}

/** Result types for bomb operations. */
type StartBombResult = Result<void, BombError>;

/** Event callbacks for bomb state changes. */
export interface BombControllerEvents {
  readonly onBombStarted?: (pos: GridPosition, durationMs: number) => void;
  readonly onBombCompleted?: (newPipe: Pipe) => void;
  readonly onBombCancelled?: (pos: GridPosition) => void;
}

/**
 * Manages bomb animations and pipe replacements.
 * Bombs allow players to replace existing pipes with queued ones.
 */
export class BombController {
  private bombingPipes: Map<Pipe, BombInfo> = new Map();

  constructor(
    private readonly grid: Grid,
    private readonly queue: PipeQueue,
    private readonly logger: ILogger,
    private readonly config: IBombConfig,
    private readonly events: BombControllerEvents = {}
  ) {}

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Attempts to start a bomb animation on the given pipe.
   * Validates all conditions and returns explicit error if it fails.
   */
  startBomb(existingPipe: Pipe, currentTime: number): StartBombResult {
    // Validate: max bombs limit
    if (this.bombingPipes.size >= this.config.maxBombs) {
      this.logger.debug(
        `Cannot start bomb: max limit of ${this.config.maxBombs} reached`
      );
      return R.fail('max_bombs_reached');
    }

    // Validate: cannot bomb start pipe
    if (existingPipe === this.grid.tryGetStartPipe()) {
      this.logger.debug("Cannot bomb the start pipe");
      return R.fail('cannot_bomb_start_pipe');
    }

    // Validate: pipe must not be blocked
    if (existingPipe.isBlocked) {
      this.logger.debug(`Pipe at ${existingPipe.position} is blocked`);
      return R.fail('pipe_blocked');
    }

    // Get replacement pipe from queue
    const replacementPipe = this.queue.peek();
    if (!replacementPipe) {
      this.logger.warn("No pipe in queue for bomb replacement");
      return R.fail('queue_empty');
    }

    // Start the bomb animation
    existingPipe.startBombAnimation(currentTime);

    // Store bomb info
    const bombInfo: BombInfo = {
      pipe: existingPipe,
      startTime: currentTime,
      replacementPipe,
    };
    this.bombingPipes.set(existingPipe, bombInfo);

    // Notify listeners
    const durationMs = this.config.bombTimerSeconds * 1000;
    this.events.onBombStarted?.(existingPipe.position, durationMs);

    this.logger.info(
      `Started bomb at ${existingPipe.position} (${this.bombingPipes.size}/${this.config.maxBombs} active)`
    );

    return R.ok(undefined);
  }

  /**
   * Updates all active bombs and completes any that have expired.
   * Should be called every frame.
   */
  update(currentTime: number): void {
    const completedBombs: BombInfo[] = [];
    for (const bombInfo of this.bombingPipes.values()) {
      const elapsed = currentTime - bombInfo.startTime;
      if (elapsed >= this.config.bombTimerSeconds) {
        completedBombs.push(bombInfo);
      }
    }

    // Process completed bombs
    for (const bombInfo of completedBombs) {
      this.completeBomb(bombInfo);
    }
  }

  /** Cancels all active bombs (useful for game reset). */
  cancelAll(): void {
    for (const bombInfo of this.bombingPipes.values()) {
      bombInfo.pipe.resetBombState();
    }
    this.bombingPipes.clear();
    this.logger.debug("All bombs cancelled");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  /** Completes a bomb by removing the old pipe and placing the replacement. */
  private completeBomb(bombInfo: BombInfo): void {
    const { pipe: oldPipe } = bombInfo;
    const cell = this.grid.getCell(oldPipe.position);

    // Remove from tracking
    this.bombingPipes.delete(oldPipe);
    oldPipe.resetBombState();

    // Remove old pipe
    this.grid.removePipe(cell);
    this.logger.debug(`Bomb exploded at ${cell.position}`);

    // Dequeue and place replacement pipe
    const queued = this.queue.dequeue();
    if (!queued) {
      this.logger.error("Queue empty during bomb completion - this should not happen");
      return;
    }

    // Create and place new pipe
    const newPipe = new Pipe(cell.position, queued.shape, queued.direction);
    const setResult = this.grid.setPipe(cell, newPipe);

    if (setResult.success) {
      this.logger.info(`Replaced bombed pipe at ${cell.position} with ${queued.shape.id} [${queued.direction}]`);
      this.events.onBombCompleted?.(newPipe);
    } else {
      this.logger.error(`Failed to place replacement pipe: ${setResult.error}`);
    }
  }
}