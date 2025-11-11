import { describe, it, beforeEach, expect, vi } from "vitest";
import { FlowNetwork } from "../../src/core/FlowNetwork";
import { Direction } from "../../src/core/Direction";

describe("FlowNetwork", () => {
  let loggerMock: any;
  let startPipe: any;
  let pipeA: any;
  let deadEnd: any;
  let gridMock: any;
  let cellMap: Map<string, any>;

  beforeEach(() => {
    loggerMock = { info: vi.fn() };

    startPipe = {
      position: { x: 0, y: 0 },
      direction: Direction.Right,
      openPorts: [Direction.Right],
      accepts: vi.fn(() => true),
      markUsed: vi.fn(),
    };

    pipeA = {
      position: { x: 1, y: 0 },
      openPorts: [Direction.Left, Direction.Right],
      accepts: vi.fn((dir: any) => dir === Direction.Left),
      markUsed: vi.fn(),
    };

    deadEnd = {
      position: { x: 1, y: 0 },
      openPorts: [Direction.Left],
      accepts: vi.fn(() => true),
      markUsed: vi.fn(),
    };

    // Create a map to store cells by position
    cellMap = new Map();
    // Helper to create cell objects
    const createCell = (x: number, y: number, pipe: any = null, blocked: boolean = false) => ({
      x,
      y,
      pipe,
      blocked,
    });

    // Initialize grid with cells
    cellMap.set("0,0", createCell(0, 0, startPipe));
    cellMap.set("1,0", createCell(1, 0, pipeA));

    gridMock = {
      startPipe,
      width: 2,
      height: 1,
      tryGetCell: vi.fn((x: number, y: number) => {
        if (x < 0 || x >= 2 || y !== 0) return null;
        return cellMap.get(`${x},${y}`) || null;
      }),
    };

    FlowNetwork["activeStates"] = [];
    FlowNetwork["visitedPorts"].clear?.();
  });

  it("should initialize flow with start pipe and delay", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 2);
    const state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.pipe).toBe(startPipe);
    expect(state!.delayRemaining).toBe(2);
    expect(state!.entryDir).toBeNull();
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Flow initialized at ${startPipe.position} with delay 2s`
    );
  });

  it("should decrease delay without advancing", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 2);
    FlowNetwork.update(1, 50, gridMock, loggerMock);
    const state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.delayRemaining).toBe(1);
    expect(state!.progress).toBe(0);
  });

  it("should advance flow to next pipe when progress reaches 100", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);

    // Start pipe fills fully and advances
    FlowNetwork.update(2, 50, gridMock, loggerMock);
    let state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.pipe).toBe(pipeA);
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Flow advanced from ${startPipe.position} to ${pipeA.position}`
    );

    // Only start pipe exit marked
    expect(startPipe.markUsed).toHaveBeenCalledWith(Direction.Right);
    expect(pipeA.markUsed).not.toHaveBeenCalled();

    // Half-fill pipeA → marks entry
    FlowNetwork.update(1, 50, gridMock, loggerMock);
    expect(pipeA.markUsed).toHaveBeenCalledWith(Direction.Left);
  });

  it("should ignore invalid next positions", () => {
    // Set pipeA cell to have no pipe
    cellMap.set("1,0", { x: 1, y: 0, pipe: null, blocked: false });
    
    FlowNetwork.initialize(gridMock, loggerMock, 1);
    FlowNetwork.update(2, 50, gridMock, loggerMock);
    const state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.pipe).toBe(startPipe);
  });

  it("should track visited ports correctly", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);
    FlowNetwork.update(2, 50, gridMock, loggerMock); // start pipe fills + advance
    FlowNetwork.update(1, 50, gridMock, loggerMock); // pipeA half fill
    const visited = FlowNetwork.getVisitedPortsSnapshot();
    expect(visited.find(v => v.pipe === startPipe)?.dirs).toContain(Direction.Right);
    expect(visited.find(v => v.pipe === pipeA)?.dirs).toContain(Direction.Left);
  });

  it("should mark pipe entry only after reaching 50% progress", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);

    // Fill startPipe → moves to pipeA
    FlowNetwork.update(2, 50, gridMock, loggerMock);

    // Now pipeA is active and at 0 progress
    FlowNetwork.update(1, 25, gridMock, loggerMock); // 25% filled
    let visited = FlowNetwork.getVisitedPortsSnapshot();
    // Nothing yet (entry not marked)
    expect(visited.find(v => v.pipe === pipeA)).toBeUndefined();

    // Hit 50%
    FlowNetwork.update(1, 25, gridMock, loggerMock);
    visited = FlowNetwork.getVisitedPortsSnapshot();
    expect(visited.find(v => v.pipe === pipeA)?.dirs).toContain(Direction.Left);
  });

  it("should handle start pipe with no entryDir gracefully", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);
    const state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.entryDir).toBeNull();
    FlowNetwork.update(1, 50, gridMock, loggerMock); // should not throw
    expect(() => FlowNetwork.update(1, 50, gridMock, loggerMock)).not.toThrow();
  });

  it("should stop flow at dead-end pipe", () => {
    // Update the cell at (1,0) to contain the dead-end pipe
    cellMap.set("1,0", { x: 1, y: 0, pipe: deadEnd, blocked: false });

    FlowNetwork.initialize(gridMock, loggerMock, 0);
    FlowNetwork.update(2, 50, gridMock, loggerMock); // start fills + advances

    let state = FlowNetwork.getActiveState();
    expect(state).not.toBeUndefined();
    expect(state!.pipe).toBe(deadEnd);

    // Advance enough to fill dead-end (it should stop)
    FlowNetwork.update(3, 50, gridMock, loggerMock);

    // Now there should be no active states left
    const finalState = FlowNetwork.getActiveState();
    expect(finalState).toBeUndefined();

    // Should have logged exactly one advance (start -> deadEnd)
    const advanceLogs = loggerMock.info.mock.calls.filter(
      ([msg]: [string]) => msg.includes("advanced from")
    );
    expect(advanceLogs).toHaveLength(1);

    // And the log should mention the correct pipes
    expect(advanceLogs[0][0]).toContain("advanced from");
  });
});