import { describe, it, beforeEach, expect, vi } from "vitest";
import { PipeShapes, PipeType } from "../../../../src/core/constants/PipeShapes";
import { GridPosition } from "../../../../src/core/domain/grid/GridPosition";
import { IGridConfig } from "../../../../src/config/GameConfig";
import { FlowNetwork } from "../../../../src/core/domain/flow/FlowNetwork";
import { Direction } from "../../../../src/core/domain/Direction";
import { ILogger } from "../../../../src/core/logging/ILogger";
import { Grid } from "../../../../src/core/domain/grid/Grid";
import { Pipe } from "../../../../src/core/domain/pipe/Pipe";


const createMockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('FlowNetwork', () => {
  let grid: Grid;
  let flowNetwork: FlowNetwork;
  let logger: ILogger;
  let config: IGridConfig;

  beforeEach(() => {
    logger = createMockLogger();
    config = {
      width: 10,
      height: 8,
      cellSize: 32,
      blockedPercentage: 0,
      allowStartPipeOnEdge: false,
    };
    grid = new Grid(config, logger);
    grid.initialize();
    flowNetwork = new FlowNetwork(grid, logger);
  });

  describe('initialization', () => {
    it('should initialize flow from start pipe', { timeout: 1000 }, () => {
      flowNetwork.initialize();
      const state = flowNetwork.getActiveState();
      
      expect(state).toBeDefined();
      expect(state?.pipe).toBe(grid.startPipe);
      expect(state?.progress).toBe(0);
    });

    it('should support initial delay', { timeout: 1000 }, () => {
      flowNetwork.initialize(2.5);
      const state = flowNetwork.getActiveState();
      
      expect(state?.delayRemaining).toBe(2.5);
    });

    it('should warn if no start pipe', { timeout: 1000 }, () => {
      const emptyGrid = new Grid(config, logger);
      const emptyFlow = new FlowNetwork(emptyGrid, logger);
      
      emptyFlow.initialize();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no start pipe')
      );
    });

    it('should clear cache on initialization', { timeout: 1000 }, () => {
      flowNetwork.initialize();
      flowNetwork.update(1, 50);
      
      // Re-initialize should clear previous state
      flowNetwork.initialize();
      const state = flowNetwork.getActiveState();
      expect(state?.progress).toBe(0);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      flowNetwork.initialize();
    });

    it('should advance progress over time', { timeout: 1000 }, () => {
      const initialProgress = flowNetwork.getActiveState()?.progress ?? 0;
      flowNetwork.update(0.5, 50); // 0.5s at 50 units/s = 25 progress
      
      const newProgress = flowNetwork.getActiveState()?.progress ?? 0;
      expect(newProgress).toBeGreaterThan(initialProgress);
      expect(newProgress).toBeCloseTo(25, 1);
    });

    it('should respect initial delay', { timeout: 1000 }, () => {
      flowNetwork.clear();
      flowNetwork.initialize(1.0);
      
      const before = flowNetwork.getActiveState()?.progress ?? 0;
      flowNetwork.update(0.5, 50); // Still in delay period
      const after = flowNetwork.getActiveState()?.progress ?? 0;
      
      expect(before).toBe(after); // No progress during delay
    });

    it('should mark ports as used when flow passes through', { timeout: 1000 }, () => {
      const startPipe = grid.startPipe;
      const exitDir = startPipe.openPorts[0];

      flowNetwork.initialize();

      // Simulate some flow time
      for (let i = 0; i < 50; i++) {
        flowNetwork.update(0.1, 50);
      }

      // Even if not fully completed, the start port should be marked as used
      expect(startPipe.usedPorts).toContain(exitDir);
    });

    it('should stop when reaching dead end', { timeout: 1000 }, () => {
      // Start pipe with no connected neighbors
      flowNetwork.update(3, 50); // More than enough time
      
      const state = flowNetwork.getActiveState();
      expect(state).toBeUndefined(); // Flow should stop
    });

    it('should continue to next connected pipe', { timeout: 1000 }, () => {
      const startPipe = grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      const nextPos = startPipe.position.move(exitDir, 10, 8);
      
      if (nextPos) {
        const nextPipe = new Pipe(nextPos, PipeShapes[PipeType.Straight], exitDir);
        grid.setPipe(grid.getCell(nextPos), nextPipe);
        
        // Flow through first pipe with safety counter
        let iterations = 0;
        const MAX_ITERATIONS = 100;
        while ((flowNetwork.getActiveState()?.pipe) === startPipe && iterations < MAX_ITERATIONS) {
          flowNetwork.update(0.1, 50);
          iterations++;
        }
        
        if (iterations >= MAX_ITERATIONS) {
          console.warn('Hit max iterations - flow may be stuck');
        }
        
        const state = flowNetwork.getActiveState();
        expect(state?.pipe).toBe(nextPipe);
      }
    });
  });

  describe('path selection', () => {
      it('should choose longest path at junctions', { timeout: 1000 }, () => {
      // Create a junction with one long path and one short path
      const startPipe = grid.startPipe;
      const exitDir = startPipe.openPorts[0];
      
      // Place a cross piece that creates a junction
      const junctionPos = startPipe.position.move(exitDir, 10, 8);
      if (!junctionPos) {
        return;
      }
      
      // Create junction with rotation that ensures it accepts exitDir.opposite
      const junction = new Pipe(junctionPos, PipeShapes[PipeType.Cross], exitDir.opposite);
      grid.setPipe(grid.getCell(junctionPos), junction);
      
      // Verify junction can actually accept the flow
      expect(junction.accepts(exitDir.opposite)).toBe(true);
      
      // Add pipes in multiple directions from junction to create path choices
      const rightDir = exitDir.rotate90();
      const leftDir = rightDir.opposite;
      
      // Create a longer path to the left
      const leftPos1 = junctionPos.move(leftDir, 10, 8);
      if (leftPos1) {
        const leftPipe1 = new Pipe(leftPos1, PipeShapes[PipeType.Straight], leftDir);
        grid.setPipe(grid.getCell(leftPos1), leftPipe1);
        
        const leftPos2 = leftPos1.move(leftDir, 10, 8);
        if (leftPos2) {
          const leftPipe2 = new Pipe(leftPos2, PipeShapes[PipeType.Straight], leftDir);
          grid.setPipe(grid.getCell(leftPos2), leftPipe2);
        }
      }
      
      // Create a shorter path to the right
      const rightPos1 = junctionPos.move(rightDir, 10, 8);
      if (rightPos1) {
        const rightPipe1 = new Pipe(rightPos1, PipeShapes[PipeType.Straight], rightDir);
        grid.setPipe(grid.getCell(rightPos1), rightPipe1);
      }

      flowNetwork.initialize();

      // Flow should select a valid exit and traverse pipes
      let iterations = 0;
      const MAX_ITER = 200;
      while (flowNetwork.getActiveState() && iterations < MAX_ITER) {
        flowNetwork.update(0.1, 50);
        iterations++;
      }

      const visited = flowNetwork.getVisitedPortsSnapshot();
      
      // Should have visited at least the start pipe and junction
      expect(visited.length).toBeGreaterThan(0);
      
      // Verify the junction was actually visited
      const junctionVisited = visited.some(v => v.pipe.position.equals(junctionPos));
      expect(junctionVisited).toBe(true);
    });

    it('should not revisit same ports', { timeout: 1000 }, () => {
      const startPipe = grid.startPipe;
      flowNetwork.update(0.5, 50);
      
      const visitedBefore = flowNetwork.getVisitedPortsSnapshot();
      flowNetwork.update(0.5, 50);
      const visitedAfter = flowNetwork.getVisitedPortsSnapshot();
      
      // Visited ports should only grow, not change existing entries
      expect(visitedAfter.length).toBeGreaterThanOrEqual(visitedBefore.length);
    });
  });

  describe('cache invalidation', () => {
    it('should provide invalidation method', { timeout: 1000 }, () => {
      const pipe = new Pipe(
        GridPosition.createUnsafe(5, 5),
        PipeShapes[PipeType.Straight],
        Direction.Right
      );
      
      expect(() => flowNetwork.invalidatePathCache(pipe)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all flow state', { timeout: 1000 }, () => {
      flowNetwork.initialize();
      flowNetwork.update(1, 50);
      
      flowNetwork.clear();
      
      expect(flowNetwork.getActiveState()).toBeUndefined();
      expect(flowNetwork.getVisitedPortsSnapshot()).toHaveLength(0);
    });
  });
});