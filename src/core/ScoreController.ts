import EventEmitter from "eventemitter3";
import type { IScoreConfig } from "../config/GameConfig";
import type { ILogger } from "./logging/ILogger";
import type { Pipe } from "./domain/pipe/Pipe";
import { PipeType } from "./constants/PipeShapes";


interface ScoreEvents {
  onScoreUpdated: (score: number, pipesFlowed: number) => void;
  onWin: (finalScore: number, pipesFlowed: number) => void;
  onLose: (finalScore: number, pipesFlowed: number, reason: 'flow_stuck' | 'no_path') => void;
}

/**
 * Tracks score and win/lose conditions based on water flow.
 * Listens to flow events and determines game outcome.
 */
export class ScoreController extends EventEmitter<ScoreEvents> {
  private _score = 0;
  private _pipesFlowed = 0;
  private _gameEnded = false;
  private _flowedPipes = new Set<Pipe>();

  constructor(
    private readonly config: IScoreConfig,
    private readonly logger: ILogger
  ) { super(); }

  /**
   * Called when water successfully flows through a pipe.
   * Increments score and checks for win condition.
   */
  onPipeFlowed(pipe: Pipe): void {
    if (this._gameEnded) return;

    // Dont count start pipe
    if (pipe.shape.id == PipeType.Start) return;

    // Only count each pipe once
    if (this._flowedPipes.has(pipe)) return;

    this._flowedPipes.add(pipe);
    this._pipesFlowed++;
    
    const pointsPerPipe = this.config.pointsPerPipe ?? 10;
    this._score += pointsPerPipe;

    this.emit("onScoreUpdated", this._score, this._pipesFlowed);

    // Check win condition
    if (this._pipesFlowed >= this.config.winFilledPipesCount) {
      this.triggerWin();
    }
  }

  /**
   * Called when water flow gets stuck (no valid exit from current pipe).
   * Triggers lose condition if not enough pipes have been flowed through.
   */
  onFlowStuck(): void {
    if (this._gameEnded) return;

    this.logger.warn(
      `Flow stuck at ${this._pipesFlowed}/${this.config.winFilledPipesCount} pipes`
    );

    if (this._pipesFlowed < this.config.winFilledPipesCount) {
      this.triggerLose('flow_stuck');
    }
  }

  /**
   * Called when water tries to exit but there's no valid pipe to continue.
   * Triggers lose condition if target not reached.
   */
  onNoPathAvailable(): void {
    if (this._gameEnded) return;

    this.logger.warn(
      `No path available at ${this._pipesFlowed}/${this.config.winFilledPipesCount} pipes`
    );

    if (this._pipesFlowed < this.config.winFilledPipesCount) {
      this.triggerLose('no_path');
    }
  }

  // ============================================================================
  // Public API - State Access
  // ============================================================================

  /** Returns the current score. */
  get score(): number {
    return this._score;
  }

  /** Returns the number of pipes water has flowed through. */
  get pipesFlowed(): number {
    return this._pipesFlowed;
  }

  /** Returns the target number of pipes needed to win. */
  get targetScore(): number {
    return this.config.winFilledPipesCount;
  }

  /** Returns whether the game has ended (win or lose). */
  get gameEnded(): boolean {
    return this._gameEnded;
  }

  /** Returns the progress as a percentage (0-100). */
  get progressPercent(): number {
    return Math.min(100, (this._pipesFlowed / this.config.winFilledPipesCount) * 100);
  }

  // ============================================================================
  // Public API - Lifecycle
  // ============================================================================

  /** Resets the score and game state. */
  reset(): void {
    this._score = 0;
    this._pipesFlowed = 0;
    this._gameEnded = false;
    this._flowedPipes.clear();
    this.logger.info("Score controller reset");
  }

  // ============================================================================
  // Private Implementation
  // ============================================================================

  private triggerWin(): void {
    if (this._gameEnded) return;
    
    this._gameEnded = true;
    this.logger.info(`WIN! Final score: ${this._score} (${this._pipesFlowed} pipes)`);
    this.emit("onWin", this._score, this._pipesFlowed);
  }

  private triggerLose(reason: 'flow_stuck' | 'no_path'): void {
    if (this._gameEnded) return;
    
    this._gameEnded = true;
    this.logger.info(`LOSE (${reason})! Final score: ${this._score} (${this._pipesFlowed}/${this.config.winFilledPipesCount} pipes)`);
    this.emit("onLose", this._score, this._pipesFlowed, reason);
  }
}