import type { Logger } from "../utils/Logger";
import { Pipe, PipeType } from "./Pipe";
import { Grid } from "./Grid";

/**
 * Represents the current logical state of the game.
 * Holds the grid, level data, score, and progression state.
 */
export class GameState {
  readonly grid: Grid;
  private readonly logger: Logger;

  private score: number = 0;
  private isRunning: boolean = false;

  constructor(gridWidth: number, gridHeight: number, logger: Logger) {
    this.logger = logger;
    this.grid = new Grid(gridWidth, gridHeight, logger);
    this.logger.info(`GameState initialized (${gridWidth}x${gridHeight})`);
  }

  /**
   * Starts a new level or resumes gameplay.
   */
  start(): void {
    this.isRunning = true;
    this.logger.info("Game started");

    const cell = this.grid.getRandomEmptyCell();
    if (cell) {
      const startPipe = new Pipe(PipeType.Start, 0);
      this.grid.placePipe(cell.x, cell.y, startPipe);
      this.logger.info(`Start pipe placed at (${cell.x}, ${cell.y})`);
    }
  }

  /**
   * Stops or pauses the game.
   */
  stop(): void {
    this.isRunning = false;
    this.logger.info("Game stopped");
  }

  /**
   * Resets the entire game state.
   */
  reset(): void {
    this.score = 0;
    this.isRunning = false;
    this.logger.info("Game reset");
  }

  /**
   * Adds score points.
   */
  addScore(points: number): void {
    this.score += points;
    this.logger.debug(`Score: ${this.score}`);
  }

  /**
   * Returns the current score.
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Returns whether the game is currently running.
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Logs a summary of the current game state (for debugging).
   */
  debugSummary(): void {
    this.logger.info(
      `Score: ${this.score} | Running: ${this.isRunning}`
    );
    this.grid.debugPrint();
  }
}