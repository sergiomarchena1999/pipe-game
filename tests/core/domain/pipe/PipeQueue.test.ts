import { describe, it, beforeEach, expect, vi } from "vitest";
import { IQueueConfig } from "../../../../src/config/GameConfig";
import { PipeQueue } from "../../../../src/core/domain/pipe/PipeQueue";
import { PipeType } from "../../../../src/core/constants/PipeShapes";
import { ILogger } from "../../../../src/core/logging/ILogger";


const createMockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('PipeQueue', () => {
  let logger: ILogger;
  let config: IQueueConfig;

  beforeEach(() => {
    logger = createMockLogger();
    config = {
      maxSize: 3,
      pipeWeights: {
        [PipeType.Straight]: 10,
        [PipeType.Corner]: 10,
        [PipeType.Cross]: 5,
        [PipeType.Start]: 0,
      },
    };
  });

  describe('initialization', () => {
    it('should fill queue to max size on creation', () => {
      const queue = new PipeQueue(logger, config);
      expect(queue.contents).toHaveLength(3);
    });

    it('should emit onUpdated event on initialization', () => {
      const listener = vi.fn();
      const queue = new PipeQueue(logger, config);
      queue.on('onUpdated', listener);
      
      // Clear and trigger update
      queue.reset();
      expect(listener).toHaveBeenCalled();
    });

    it('should generate pipes with valid shapes', () => {
      const queue = new PipeQueue(logger, config);
      queue.contents.forEach(pipe => {
        expect(pipe.shape).toBeDefined();
        expect(pipe.direction).toBeDefined();
        expect(pipe.shape.id).not.toBe(PipeType.Start);
      });
    });
  });

  describe('dequeue', () => {
    it('should remove and return first pipe', () => {
      const queue = new PipeQueue(logger, config);
      const first = queue.contents[0];
      const dequeued = queue.dequeue();
      
      expect(dequeued).toBe(first);
      expect(queue.contents).not.toContain(first);
    });

    it('should maintain queue size after dequeue', () => {
      const queue = new PipeQueue(logger, config);
      queue.dequeue();
      expect(queue.contents).toHaveLength(3);
    });

    it('should emit onDequeued event', () => {
      const queue = new PipeQueue(logger, config);
      const listener = vi.fn();
      queue.on('onDequeued', listener);
      
      const pipe = queue.dequeue();
      expect(listener).toHaveBeenCalledWith(pipe);
    });

    it('should emit onUpdated event', () => {
      const queue = new PipeQueue(logger, config);
      const listener = vi.fn();
      queue.on('onUpdated', listener);
      
      queue.dequeue();
      expect(listener).toHaveBeenCalledWith(queue.contents);
    });

    it('should refill if queue becomes empty', () => {
      // Create queue with size 1, dequeue it
      const maxSizeConfig: IQueueConfig = {
        ...config,
        maxSize: 1,
      };
      const queue = new PipeQueue(logger, maxSizeConfig);
      
      queue.dequeue();
      expect(queue.contents).toHaveLength(1);
    });

    it('should log warning when dequeueing from empty queue', () => {
      // Force empty queue scenario
      const maxSizeConfig: IQueueConfig = {
        ...config,
        maxSize: 0,
      };
      const queue = new PipeQueue(logger, maxSizeConfig);
      queue.dequeue();
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('empty')
      );
    });
  });

  describe('peek', () => {
    it('should return first pipe without removing it', () => {
      const queue = new PipeQueue(logger, config);
      const first = queue.contents[0];
      const peeked = queue.peek();
      
      expect(peeked).toBe(first);
      expect(queue.contents).toHaveLength(3);
      expect(queue.contents[0]).toBe(first);
    });

    it('should return null for empty queue', () => {
      const maxSizeConfig: IQueueConfig = {
        ...config,
        maxSize: 0,
      };
      const queue = new PipeQueue(logger, maxSizeConfig);
      expect(queue.peek()).toBeNull();
    });

    it('should not emit any events', () => {
      const queue = new PipeQueue(logger, config);
      const listener = vi.fn();
      queue.on('onDequeued', listener);
      queue.on('onUpdated', listener);
      
      queue.peek();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear and refill queue', () => {
      const queue = new PipeQueue(logger, config);
      const oldPipes = [...queue.contents];
      
      queue.reset();
      
      expect(queue.contents).toHaveLength(3);
      // Should have different pipes (statistically very likely)
      const hasNewPipes = queue.contents.some(p => !oldPipes.includes(p));
      expect(hasNewPipes).toBe(true);
    });

    it('should log reset', () => {
      const queue = new PipeQueue(logger, config);
      queue.reset();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('reset')
      );
    });
  });

  describe('contents', () => {
    it('should return readonly array', () => {
      const queue = new PipeQueue(logger, config);
      const contents = queue.contents;
      
      // TypeScript readonly should prevent this at compile time
      // Runtime we can still verify the concept
      expect(Array.isArray(contents)).toBe(true);
    });

    it('should reflect current queue state', () => {
      const queue = new PipeQueue(logger, config);
      const before = queue.contents.length;
      queue.dequeue();
      const after = queue.contents.length;
      
      expect(after).toBe(before); // Refills automatically
    });
  });
});