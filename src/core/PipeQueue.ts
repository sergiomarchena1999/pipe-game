import { EventEmitter } from "eventemitter3";
import type { ILogger } from "./logging/ILogger";
import { PipeType } from "./Pipe";
import type { PipeDescriptor } from "./PipeDescriptor";
import { Direction } from "./Direction";


/** Represents a pipe entry in the queue (type + rotation). */
export interface QueuedPipe extends PipeDescriptor {}

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
    private readonly maxSize: number = 5
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
    const pipe: QueuedPipe = {
      type: this.getRandomPipeType(),
      direction: this.getRandomDirection(),
    };
    this.queue.push(pipe);
    this.logger.debug(`Enqueued new pipe: ${pipe.type} (${pipe.direction})`);
  }


  /**
   * Selects a random non-start pipe type.
   */
  private getRandomPipeType(): PipeType {
    const availableTypes = [
      PipeType.Straight,
      PipeType.Curve,
      PipeType.Cross,
    ];

    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    return availableTypes[randomIndex];
  }

  private getRandomDirection(): Direction {
    const randomIndex = Math.floor(Math.random() * Direction.All.length);
    return Direction.All[randomIndex];
  }
}