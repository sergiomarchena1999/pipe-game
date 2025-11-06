import type { ILogger } from "./logging/ILogger";
import { EventEmitter } from "eventemitter3";
import { Direction } from "./Direction";
import { PipeType } from "./Pipe";


/** Represents a pipe entry in the queue (type + direction). */
export interface QueuedPipe {
  /** The pipe’s type (straight, curve, cross, start). */
  readonly type: PipeType;
  /** The pipe’s direction (right, down, left, up). */
  readonly direction: Direction;
  /** The pipe’s asset key. */
  readonly assetKey: string;
}

/** Events emitted by the PipeQueue. */
interface PipeQueueEvents {
  updated: [readonly QueuedPipe[]];
  dequeued: [QueuedPipe];
}

/**
 * Manages the upcoming pipe pieces available to the player.
 * Emits events for UI or logic to react to.
 */
export class PipeQueue extends EventEmitter<PipeQueueEvents> {
  private readonly queue: QueuedPipe[] = [];

  constructor(
    private readonly logger: ILogger,
    private readonly weights: Record<PipeType, number>,
    private readonly maxSize: number
  ) {
    super();
    this.fillQueue();
  }

  /**
   * Gets the current contents of the queue (read-only).
   */
  get contents(): readonly QueuedPipe[] {
    return this.queue;
  }

  /**
   * Removes and returns the next pipe from the queue.
   * Automatically refills the queue afterward.
   */
  dequeue(): QueuedPipe {
    if (this.queue.length === 0) {
      this.logger.warn("PipeQueue is empty — regenerating.");
      this.fillQueue();
    }

    const next = this.queue.shift()!;
    this.enqueueRandomPipe();
    this.emit("dequeued", next);
    this.emit("updated", this.queue);
    this.logger.debug(`Dequeued pipe: ${next}`);

    return next;
  }

  /**
   * Refills the queue to its maximum size.
   */
  private fillQueue(): void {
    while (this.queue.length < this.maxSize) {
      this.enqueueRandomPipe();
    }
    this.emit("updated", this.queue);
    this.logger.info(`PipeQueue initialized with ${this.queue.length} items.`);
  }

  /**
   * Randomly generates a pipe and adds it to the queue.
   */
  private enqueueRandomPipe(): void {
    const type = this.getRandomPipeType()
    const pipe: QueuedPipe = {
      type,
      direction: this.getRandomDirection(),
      assetKey: `pipe-${type}`
    };
    this.queue.push(pipe);
    this.logger.debug(`Enqueued new pipe: ${pipe.type} (${pipe.direction})`);
  }


    /**
   * Selects a random non-start pipe type using weighted probabilities.
   */
  private getRandomPipeType(): PipeType {
    const entries = Object.entries(this.weights) as [PipeType, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let random = Math.random() * total;

    for (const [type, weight] of entries) {
      random -= weight;
      if (random <= 0) return type;
    }

    // Fallback (shouldn't happen if validation passed)
    return entries[0][0];
  }

  private getRandomDirection(): Direction {
    const randomIndex = Math.floor(Math.random() * Direction.All.length);
    return Direction.All[randomIndex];
  }
}