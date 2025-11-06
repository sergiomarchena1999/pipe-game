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

    const type = queue.dequeue();

    expect(Object.values(PipeType)).toContain(type);
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

  it("should enqueue pipes with correct types and directions", () => {
    const first = queue.contents[0];
    expect(Object.values(PipeType)).toContain(first.type);
    expect(Direction.All).toContain(first.direction);
  });
});
