import type { IBombConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";
import type { Direction } from "./Direction";
import type { PipeQueue } from "./PipeQueue";
import type { GridCell } from "./GridCell";
import type { Grid } from "./Grid";
import { Pipe } from "./Pipe";


export interface BombInfo {
  pipe: Pipe;
  startTime: number;
  replacementShape: string;
  replacementDirection: Direction;
}

interface BombEvents {
  onBombStarted: (cell: GridCell, durationMs: number) => void;
  onBombCompleted: (newPipe: Pipe) => void;
}

/** Manages bomb animations and pipe replacements. */
export class BombController {
  private bombingPipes: Map<Pipe, BombInfo> = new Map();

  constructor(
    private readonly grid: Grid,
    private readonly queue: PipeQueue,
    private readonly logger: ILogger,
    private readonly bombConfig: IBombConfig,
    private readonly events: BombEvents
  ) {}

  /**
   * Attempts to start a bomb animation on the given pipe.
   * Stores the queued pipe info for replacement after explosion.
   * @returns true if bomb was started, false otherwise
   */
  startBomb(existingPipe: Pipe, currentTime: number): boolean {
    if (this.bombingPipes.size >= this.bombConfig.maxBombs) {
        this.logger.debug(`Cannot have more bombs than max.`);
        return false;
    }

    if (existingPipe === this.grid.startPipe) {
      this.logger.debug(`Cannot bomb start pipe.`);
      return false;
    }

    if (existingPipe.blocked) {
      this.logger.debug(`Pipe at ${existingPipe.position} is blocked.`);
      return false;
    }

    // Get the next pipe from queue for replacement
    const queued = this.queue.peek();
    if (!queued) {
      this.logger.warn("No pipe in queue to replace with after bomb");
      return false;
    }

    // Start the bomb animation
    existingPipe.startBombAnimation(currentTime);
    
    // Store bomb info including replacement pipe data
    this.bombingPipes.set(existingPipe, {
      pipe: existingPipe,
      startTime: currentTime,
      replacementShape: queued.shape.id,
      replacementDirection: queued.direction
    });

    // Emit event for rendering
    this.events.onBombStarted(
      existingPipe.position, 
      this.bombConfig.bombTimerSeconds * 1000
    );
    
    this.logger.info(`Started bomb animation at ${existingPipe.position}`);
    return true;
  }

  /**
   * Updates all active bombs and completes expired ones.
   */
  update(currentTime: number): void {
    const completedBombs: BombInfo[] = [];
    for (const bombInfo of this.bombingPipes.values()) {
      const elapsed = currentTime - bombInfo.startTime;
      if (elapsed >= this.bombConfig.bombTimerSeconds) {
        completedBombs.push(bombInfo);
      }
    }

    // Process completed bombs
    for (const bombInfo of completedBombs) {
      this.completeBomb(bombInfo);
    }
  }

  /** Completes a bomb by removing the old pipe and placing the replacement. */
  private completeBomb(bombInfo: BombInfo): void {
    const { pipe: oldPipe } = bombInfo;
    const cell = oldPipe.position;

    // Remove from tracking
    this.bombingPipes.delete(oldPipe);
    oldPipe.resetBombState();

    // Remove old pipe
    this.grid.removePipe(cell);
    this.logger.debug(`Bomb completed at ${cell}`);

    const queued = this.queue.dequeue();
    const newPipe = new Pipe(cell, queued.shape, queued.direction);
    this.grid.setPipe(cell, newPipe);

    this.logger.info(`Replaced pipe at ${cell} with ${queued.shape.id} dir=${queued.direction}`);
    
    // Emit completion event
    this.events.onBombCompleted(newPipe);
  }

  /** Checks if there are any active bombs. */
  hasActiveBombs(): boolean {
    return this.bombingPipes.size > 0;
  }

  /** Gets the number of active bombs. */
  getActiveBombCount(): number {
    return this.bombingPipes.size;
  }

  /** Cancels all active bombs (useful for game reset). */
  cancelAll(): void {
    for (const bombInfo of this.bombingPipes.values()) {
      bombInfo.pipe.resetBombState();
    }
    this.bombingPipes.clear();
    this.logger.debug("All bombs cancelled");
  }
}