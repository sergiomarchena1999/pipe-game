import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { GameConfig } from "../../src/config/GameConfig";
import { PipeQueue } from "../../src/core/PipeQueue";
import { Direction } from "../../src/core/Direction";
import { PipeType } from "../../src/core/constants/PipeShapes";


describe("PipeQueue", () => {
  let queue: PipeQueue;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic
    queue = new PipeQueue(globalThis.mockLogger, GameConfig.pipeWeights, GameConfig.queueSize);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize queue with maxSize pipes", () => {
    expect(queue.contents.length).toBe(GameConfig.queueSize);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      `PipeQueue initialized with ${GameConfig.queueSize} items.`
    );
  });

  it("should dequeue and refill the queue", () => {
    const updatedListener = vi.fn();
    const dequeuedListener = vi.fn();
    queue.on("updated", updatedListener);
    queue.on("dequeued", dequeuedListener);

    const next = queue.dequeue();

    expect(Object.values(PipeType)).toContain(next.shape.id);
    expect(Direction.All).toContain(next.direction);
    expect(dequeuedListener).toHaveBeenCalledWith(next);
    expect(updatedListener).toHaveBeenCalledWith(queue.contents);
    expect(queue.contents.length).toBe(GameConfig.queueSize);
  });

  it("should warn and regenerate when queue is empty", () => {
    (queue as any).queue.length = 0;
    queue.dequeue();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "PipeQueue is empty — regenerating."
    );
    expect(queue.contents.length).toBe(GameConfig.queueSize);
  });

  it("should maintain FIFO order", () => {
    const first = queue.contents[0];
    const second = queue.contents[1];
    const dequeued = queue.dequeue();
    expect(dequeued).toEqual(first);
    expect(queue.contents[0]).toEqual(second);
  });

  it("should enqueue pipes with valid types and directions", () => {
    for (let i = 0; i < 10; i++) {
      const pipe = queue.dequeue();
      expect(Object.values(PipeType)).toContain(pipe.shape.id);
      expect(Direction.All).toContain(pipe.direction);
    }
  });

  it("should emit updated after fillQueue", () => {
    const spy = vi.fn();
    queue.on("updated", spy);
    (queue as any).fillQueue();
    expect(spy).toHaveBeenCalledWith(queue.contents);
  });

  it("should enqueue new pipe after each dequeue", () => {
    const initialLength = queue.contents.length;
    queue.dequeue();
    expect(queue.contents.length).toBe(initialLength);
  });

  it("should emit correct events payloads", () => {
    const dequeuedSpy = vi.fn();
    const updatedSpy = vi.fn();
    queue.on("dequeued", dequeuedSpy);
    queue.on("updated", updatedSpy);

    const pipe = queue.dequeue();
    expect(dequeuedSpy).toHaveBeenCalledWith(pipe);
    expect(updatedSpy).toHaveBeenCalledWith(queue.contents);
  });
});