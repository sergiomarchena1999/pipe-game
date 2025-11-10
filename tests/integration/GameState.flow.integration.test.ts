import { describe, it, beforeEach, expect, vi } from "vitest";
import { GameState } from "../../src/core/GameState";
import { FlowNetwork } from "../../src/core/FlowNetwork";
import { GameConfig } from "../../src/config/GameConfig";
import { ScoreController } from "../../src/core/ScoreController";
import { Direction } from "../../src/core/Direction";

describe("Integration: GameState + Flow + Score", () => {
  let state: GameState;

  beforeEach(() => {
    // Make pipe selection deterministic
    vi.spyOn(Math, "random").mockReturnValue(0);
    state = new GameState(GameConfig, globalThis.mockLogger);
    state.start();
  });

  it("should place pipes, advance flow, and update score", () => {
    const grid = state.grid;
    const score = state.score as ScoreController;

    // Place 2 pipes in a straight line from start
    const start = grid.startPipe!;
    const sx = start.position.x;
    const sy = start.position.y;

    const exitDir = start.getOpenPorts()[0];
    const nextPos1 = { x: sx + exitDir.dx, y: sy + exitDir.dy };
    const nextPos2 = { x: nextPos1.x + exitDir.dx, y: nextPos1.y + exitDir.dy };

    const pipe1 = state.placeNextPipe(nextPos1.x, nextPos1.y);
    const pipe2 = state.placeNextPipe(nextPos2.x, nextPos2.y);

    expect(pipe1).not.toBeNull();
    expect(pipe2).not.toBeNull();

    // Initialize flow AFTER placing pipes
    FlowNetwork.initialize(grid, globalThis.mockLogger, 0);

    // Advance flow with enough delta to traverse all pipes
    FlowNetwork.update(1, 100, grid, globalThis.mockLogger);

    // Verify all ports along the path are marked used
    expect(start.hasOpenPort(exitDir)).toBe(false);
    expect(pipe1!.hasOpenPort(exitDir)).toBe(false);
    expect(pipe2!.hasOpenPort(exitDir)).toBe(false);

    // Score should reflect all 3 connected pipes
    score.updateScore();
    expect(score.getScore()).toBe(3);

    // Snapshot visited ports should include all pipes
    const snapshot = FlowNetwork.getVisitedPortsSnapshot();
    const visitedPipes = snapshot.map(s => s.pipe);
    expect(visitedPipes).toContain(start);
    expect(visitedPipes).toContain(pipe1);
    expect(visitedPipes).toContain(pipe2);

    // Each visited pipe should have at least one port marked used
    snapshot.forEach(s => expect(s.dirs.length).toBeGreaterThanOrEqual(1));
  });
});