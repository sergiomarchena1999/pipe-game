import { describe, it, beforeEach, expect, vi } from "vitest";
import { FlowNetwork } from "../../src/core/FlowNetwork";
import { Direction } from "../../src/core/Direction";


describe("FlowNetwork", () => {
  let loggerMock: any;
  let startPipe: any;
  let pipeA: any;
  let gridMock: any;

  beforeEach(() => {
    loggerMock = { info: vi.fn() };

    // Pipes
    startPipe = {
      position: { x: 0, y: 0 },
      direction: Direction.Right,
      getOpenPorts: vi.fn(() => [Direction.Right]),
      accepts: vi.fn(() => true),
      markUsed: vi.fn(),
    };

    pipeA = {
      position: { x: 1, y: 0 },
      getOpenPorts: vi.fn(() => [Direction.Left, Direction.Right]),
      accepts: vi.fn((dir: any) => dir === Direction.Left),
      markUsed: vi.fn(),
    };

    // Grid
    gridMock = {
      startPipe,
      width: 2,
      height: 1,
      isValidPosition: vi.fn((x: number, y: number) => x >= 0 && x < 2 && y === 0),
      getPipeAt: vi.fn((x: number) => (x === 1 ? pipeA : null)),
    };
  });

  it("should initialize flow with start pipe and delay", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 2);
    const state = FlowNetwork.getActiveState();
    expect(state.pipe).toBe(startPipe);
    expect(state.delayRemaining).toBe(2);
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Flow initialized at ${startPipe.position} with delay 2s`
    );
  });

  it("should decrease delay without advancing", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 2);
    FlowNetwork.update(1, 50, gridMock, loggerMock);
    const state = FlowNetwork.getActiveState();
    expect(state.delayRemaining).toBe(1);
    expect(state.progress).toBe(0);
  });

  it("should advance flow to next pipe when progress reaches 100", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);
    FlowNetwork.update(2, 50, gridMock, loggerMock); // 2*50=100
    const state = FlowNetwork.getActiveState();
    expect(state.pipe).toBe(pipeA);
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Flow advanced from ${startPipe.position} to ${pipeA.position}`
    );
    expect(startPipe.markUsed).toHaveBeenCalledWith(Direction.Right);
    expect(pipeA.markUsed).toHaveBeenCalledWith(Direction.Left);
  });

  it("should ignore invalid next positions", () => {
    gridMock.getPipeAt = vi.fn(() => null);
    FlowNetwork.initialize(gridMock, loggerMock, 1);
    FlowNetwork.update(2, 50, gridMock, loggerMock);
    const state = FlowNetwork.getActiveState();
    expect(state.pipe).toBe(startPipe); // flow did not advance
  });

  it("should track visited ports correctly", () => {
    FlowNetwork.initialize(gridMock, loggerMock, 0);
    FlowNetwork.update(2, 50, gridMock, loggerMock);
    const visited = FlowNetwork.getVisitedPortsSnapshot();
    expect(visited.length).toBe(2);
    expect(visited.find(v => v.pipe === startPipe)?.dirs).toContain(Direction.Right);
    expect(visited.find(v => v.pipe === pipeA)?.dirs).toContain(Direction.Left);
  });
});