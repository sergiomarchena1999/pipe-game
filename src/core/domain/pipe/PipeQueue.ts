import { PipeShapes, PipeType, type PipeShape } from "../../constants/PipeShapes";
import { EventEmitter } from "eventemitter3";
import { Direction } from "../Direction";

import type { ILogger } from "../../logging/ILogger";
import type { PipeBase } from "./PipeBase";


/** Events emitted by the PipeQueue. */
interface PipeQueueEvents {
  updated: [readonly PipeBase[]];
  dequeued: [PipeBase];
}

/**
 * Manages the upcoming pipe pieces available to the player.
 * Emits events for UI or logic to react to.
 */
export class PipeQueue extends EventEmitter<PipeQueueEvents> {
  private readonly queue: PipeBase[] = [];

  constructor(
    private readonly logger: ILogger,
    private readonly weights: Record<string, number>,
    private readonly maxSize: number
  ) {
    super();
    this.fillQueue();
  }

  /** Gets the current contents of the queue (read-only). */
  get contents(): readonly PipeBase[] {
    return this.queue;
  }

  /**
   * Removes and returns the next pipe from the queue.
   * Automatically refills the queue afterward.
   */
  dequeue(): PipeBase {
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
   * Returns the next pipe in the queue without removing it.
   * @returns The next PipeBase, or null if the queue is empty.
   */
  peek(): PipeBase | null {
    if (this.queue.length === 0) {
      this.logger.warn("PipeQueue is empty — cannot peek.");
      return null;
    }
    return this.queue[0];
  }

  /** Refills the queue to its maximum size. */
  private fillQueue(): void {
    while (this.queue.length < this.maxSize) {
      this.enqueueRandomPipe();
    }
    this.emit("updated", this.queue);
    this.logger.info(`PipeQueue initialized with ${this.queue.length} items.`);
  }

  /** Randomly generates a pipe and adds it to the queue. */
  private enqueueRandomPipe(): void {
    const shape = this.getRandomPipeShape();
    const pipe: PipeBase = {
      shape,
      direction: this.getRandomDirection(),
      assetKey: `pipe-${shape.id}`
    };

    this.queue.push(pipe);
    this.logger.debug(`Enqueued new pipe: ${pipe.shape.id} (${pipe.direction})`);
  }

  /** Selects a random pipe shape based on weights. */
  private getRandomPipeShape(): PipeShape {
    const entries = Object.entries(this.weights) as [PipeType, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let random = Math.random() * total;

    for (const [id, weight] of entries) {
      random -= weight;
      if (random <= 0) return PipeShapes[id];
    }

    return PipeShapes[entries[0][0]]; // fallback
  }

  /** Returns a random valid rotation/direction for the shape */
  private getRandomDirection(): Direction {
    // Only pick from allowed directions for rotation if needed
    const index = Math.floor(Math.random() * Direction.All.length);
    return Direction.All[index];
  }
}