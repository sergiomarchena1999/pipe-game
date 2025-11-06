import { describe, it, beforeEach, expect, vi } from "vitest";
import { PipeQueue } from "../../src/core/PipeQueue";
import { PipeType } from "../../src/core/Pipe";
import { Direction } from "../../src/core/Direction";

describe("PipeQueue", () => {
  let queue: PipeQueue;

  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic
    queue = new PipeQueue(globalThis.mockLogger, 3);
  });

  it("should initialize queue with maxSize pipes", () => {
    expect(queue.contents.length).toBe(3);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith(
      "PipeQueue initialized with 3 items."
    );
  });

  it("should dequeue and refill the queue", () => {
    const updatedListener = vi.fn();
    const dequeuedListener = vi.fn();
    queue.on("updated", updatedListener);
    queue.on("dequeued", dequeuedListener);

    const next = queue.dequeue();
    expect(Object.values(PipeType)).toContain(next.type);
    expect(Direction.All).toContain(next.direction);
    expect(dequeuedListener).toHaveBeenCalled();
    expect(updatedListener).toHaveBeenCalled();
    expect(queue.contents.length).toBe(3);
  });

  it("should warn and regenerate when queue is empty", () => {
    (queue as any).queue.length = 0;
    queue.dequeue();
    expect(globalThis.mockLogger.warn).toHaveBeenCalledWith(
      "PipeQueue is empty — regenerating."
    );
  });

  it("should enqueue random pipes with valid types and directions", () => {
    const contents = queue.contents;
    for (const item of contents) {
      expect(Object.values(PipeType)).toContain(item.type);
      expect(Direction.All).toContain(item.direction);
    }
  });

  it("should emit updated after fillQueue()", () => {
    const spy = vi.fn();
    queue.on("updated", spy);
    (queue as any).fillQueue();
    expect(spy).toHaveBeenCalled();
  });

  it("should maintain FIFO order (oldest dequeued first)", () => {
    const first = queue.contents[0];
    const next = queue.dequeue();
    expect(next).toEqual(first);
  });

  it("should log debug when enqueuing a new pipe", () => {
    const lenBefore = queue.contents.length;
    (queue as any).enqueueRandomPipe();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Enqueued new pipe/)
    );
    expect(queue.contents.length).toBe(lenBefore + 1);
  });
});
