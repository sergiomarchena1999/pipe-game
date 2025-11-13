import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreController } from "../../src/core/ScoreController";
import { IScoreConfig } from "../../src/config/GameConfig";
import { ILogger } from "../../src/core/logging/ILogger";
import { Pipe } from "../../src/core/domain/pipe/Pipe";
import { PipeType } from "../../src/core/constants/PipeShapes";


describe("ScoreController", () => {
  let logger: ILogger;
  let config: IScoreConfig;
  let controller: ScoreController;
  let mockPipe: Pipe;

  beforeEach(() => {
    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as ILogger;

    config = {
      pointsPerPipe: 10,
      winFilledPipesCount: 3,
    };

    controller = new ScoreController(config, logger);
    mockPipe = { shape: { id: PipeType.Straight } } as Pipe;
  });

  describe("Initialization", () => {
    it("should start with the correct initial state", () => {
      expect(controller.score).toBe(0);
      expect(controller.pipesFlowed).toBe(0);
      expect(controller.gameEnded).toBe(false);
      expect(controller.progressPercent).toBe(0);
    });
  });

  describe("Scoring and Flow", () => {
    it("should increase score and emit onScoreUpdated when a pipe flows", () => {
      const onScoreUpdated = vi.fn();
      controller.on("onScoreUpdated", onScoreUpdated);

      controller.onPipeFlowed(mockPipe);

      expect(controller.score).toBe(10);
      expect(controller.pipesFlowed).toBe(1);
      expect(onScoreUpdated).toHaveBeenCalledWith(10, 1);
    });

    it("should not count the same pipe twice", () => {
      controller.onPipeFlowed(mockPipe);
      controller.onPipeFlowed(mockPipe); // same pipe again

      expect(controller.score).toBe(10);
      expect(controller.pipesFlowed).toBe(1);
    });
  });

  describe("Win Condition", () => {
    it("should trigger win when enough pipes flow", () => {
      const onWin = vi.fn();
      controller.on("onWin", onWin);

      const pipes = [
        { shape: { id: PipeType.Straight } },
        { shape: { id: PipeType.Corner } },
        { shape: { id: PipeType.Cross } },
      ] as Pipe[];
      pipes.forEach((p) => controller.onPipeFlowed(p));

      expect(controller.gameEnded).toBe(true);
      expect(onWin).toHaveBeenCalledWith(30, 3);
      expect(logger.info).toHaveBeenCalledWith(
        "WIN! Final score: 30 (3 pipes)"
      );
    });
  });

  describe("Lose Conditions", () => {
    it("should trigger lose when flow is stuck before winning", () => {
      const onLose = vi.fn();
      controller.on("onLose", onLose);

      controller.onPipeFlowed(mockPipe); // 1 of 3
      controller.onFlowStuck();

      expect(controller.gameEnded).toBe(true);
      expect(onLose).toHaveBeenCalledWith(10, 1, "flow_stuck");
      expect(logger.warn).toHaveBeenCalledWith("Flow stuck at 1/3 pipes");
    });

    it("should trigger lose when no path is available before winning", () => {
      const onLose = vi.fn();
      controller.on("onLose", onLose);

      controller.onPipeFlowed(mockPipe); // 1 of 3
      controller.onNoPathAvailable();

      expect(controller.gameEnded).toBe(true);
      expect(onLose).toHaveBeenCalledWith(10, 1, "no_path");
      expect(logger.warn).toHaveBeenCalledWith("No path available at 1/3 pipes");
    });

    it("should not trigger lose if already won", () => {
      controller.onPipeFlowed(mockPipe);
      controller.onPipeFlowed({ shape: { id: PipeType.Corner } } as Pipe);
      controller.onPipeFlowed({ shape: { id: PipeType.Cross } } as Pipe); // triggers win

      const onLose = vi.fn();
      controller.on("onLose", onLose);

      controller.onNoPathAvailable();
      controller.onFlowStuck();

      expect(onLose).not.toHaveBeenCalled();
    });
  });

  describe("Reset", () => {
    it("should reset all state correctly", () => {
      controller.onPipeFlowed(mockPipe);
      controller.onFlowStuck(); // lose

      controller.reset();

      expect(controller.score).toBe(0);
      expect(controller.pipesFlowed).toBe(0);
      expect(controller.gameEnded).toBe(false);
      expect(controller.progressPercent).toBe(0);
      expect(logger.info).toHaveBeenCalledWith("Score controller reset");
    });
  });

  describe("Progress", () => {
    it("should compute progress percentage correctly", () => {
    const pipe = { shape: { id: PipeType.Straight } } as Pipe;
    controller.onPipeFlowed(pipe);
    expect(controller.progressPercent).toBeCloseTo(33.33, 1);

    controller.onPipeFlowed({ shape: { id: PipeType.Corner } } as Pipe);
    expect(controller.progressPercent).toBeCloseTo(66.66, 1);

    controller.onPipeFlowed({ shape: { id: PipeType.Cross } } as Pipe);
    expect(controller.progressPercent).toBe(100);
  });
  });
});