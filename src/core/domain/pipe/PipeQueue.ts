import type { IQueueConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../logging/ILogger";
import type { PipeBase } from "./PipeBase";

import { EventEmitter } from "eventemitter3";
import { PipeGenerator } from "./PipeGenerator";


/** Events emitted by the PipeQueue. */
interface PipeQueueEvents {
  onUpdated: [readonly PipeBase[]];
  onDequeued: [PipeBase];
}

/**
 * Manages the upcoming pipe pieces available to the player.
 * Emits events for UI or logic to react to.
 */
export class PipeQueue extends EventEmitter<PipeQueueEvents> {
  private readonly queue: PipeBase[] = [];
  private readonly generator: PipeGenerator;

  constructor(
    private readonly logger: ILogger,
    private readonly config: IQueueConfig,
  ) {
    super();
    this.generator = new PipeGenerator(config.pipeWeights);
    this.fillQueue();
  }

  // ============================================================================
  // Public API
  // ============================================================================

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

    this.emit("onDequeued", next);
    this.emit("onUpdated", this.queue);
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

  /** Clears the queue and refills it with new random pipes. */
  reset(): void {
    this.queue.length = 0;
    this.fillQueue();
    this.logger.info("PipeQueue reset");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  /** Refills the queue to its maximum size. */
  private fillQueue(): void {
    while (this.queue.length < this.config.maxSize) {
      this.enqueueRandomPipe();
    }
    this.emit("onUpdated", this.queue);
    this.logger.info(`PipeQueue initialized with ${this.queue.length} items.`);
  }

  /** Generates and adds a random pipe to the queue. */
  private enqueueRandomPipe(): void {
    const pipe = this.generator.generatePipe();
    this.queue.push(pipe);
    this.logger.debug(`Enqueued new pipe: ${pipe}`);
  }
}