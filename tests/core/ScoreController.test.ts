import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScoreController } from "../../src/core/ScoreController";
import { Direction } from "../../src/core/Direction";


describe("ScoreController", () => {
  let gridMock: any;
  let scoreCtrl: ScoreController;

  // Pipe mocks
  let startPipeMock: any;
  let pipeA: any;
  let pipeB: any;

  beforeEach(() => {
    // Start pipe at (0,0), open to the right
    startPipeMock = {
      position: { x: 0, y: 0 },
      openPorts: [Direction.Right],
      accepts: vi.fn((dir: Direction) => dir === Direction.Left),
    };

    // Pipe A at (1,0), open left/right
    pipeA = {
      position: { x: 1, y: 0 },
      openPorts: [Direction.Left, Direction.Right],
      accepts: vi.fn((dir: Direction) => dir === Direction.Left || dir === Direction.Right),
    };

    // Pipe B at (2,0), open left
    pipeB = {
      position: { x: 2, y: 0 },
      openPorts: [Direction.Left],
      accepts: vi.fn((dir: Direction) => dir === Direction.Left),
    };

    // Grid mock
    gridMock = {
      width: 3,
      height: 1,
      startPipe: startPipeMock,
      isValidPosition: vi.fn((x: number, y: number) => x >= 0 && x < 3 && y === 0),
      getPipeAt: vi.fn((x: number, y: number) => {
        if (x === 0) return startPipeMock;
        if (x === 1) return pipeA;
        if (x === 2) return pipeB;
        return null;
      }),
    };

    gridMock.getConnectedNeighbors = vi.fn((pipe: any) => {
      const { x } = pipe.position;
      if (x === 0) return [pipeA];
      if (x === 1) return [startPipeMock];
      if (x === 2) return [pipeA];
      return [];
    });

    scoreCtrl = new ScoreController(gridMock.width, gridMock.height, gridMock, globalThis.mockLogger);
  });

  it("should initialize score to 0", () => {
    expect(scoreCtrl.score).toBe(0);
  });

  it("should count connected pipes correctly", () => {
    gridMock.getConnectedNeighbors = vi.fn((pipe: any) => {
      const { x } = pipe.position;
      if (x === 0) return [pipeA];
      if (x === 1) return [startPipeMock, pipeB];
      if (x === 2) return [pipeA];
      return [];
    });
    scoreCtrl.updateScore();
    expect(scoreCtrl.score).toBe(3);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("Score updated: 3 connected pipes");
  });

  it("should reset score to 0", () => {
    scoreCtrl.updateScore();
    scoreCtrl.reset();
    expect(scoreCtrl.score).toBe(0);
    expect(globalThis.mockLogger.info).toHaveBeenCalledWith("Score reset to 0");
  });

  it("should handle grid with no start pipe", () => {
    gridMock.startPipe = null;
    scoreCtrl.updateScore();
    expect(scoreCtrl.score).toBe(0);
  });

  it("should only count connected pipes when one is disconnected", () => {
    const originalGetPipeAt = gridMock.getPipeAt;
    gridMock.getPipeAt = vi.fn((x: number, y: number) => (x === 2 ? null : originalGetPipeAt(x, y)));

    scoreCtrl.updateScore();
    expect(scoreCtrl.score).toBe(2);
  });
});