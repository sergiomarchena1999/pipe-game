import type { Logger } from "../utils/Logger";
import { GameState } from "./GameState";
import { GameConfig } from "../config/GameConfig";
import { PhaserEngine } from "../engine/phaser/PhaserEngine";

/**
 * Main game controller. Orchestrates the game state and rendering engine.
 * Follows a single-responsibility pattern by delegating specific concerns
 * to specialized classes.
 */
export class Game {
  private readonly state: GameState;
  private readonly engine: PhaserEngine;
  private isRunning: boolean = false;

  constructor(private readonly logger: Logger) {
    this.state = new GameState(
      GameConfig.grid.width,
      GameConfig.grid.height,
      logger
    );
    this.engine = new PhaserEngine();
  }

  /**
   * Starts the game by initializing state and rendering engine.
   * Idempotent - safe to call multiple times.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Game already running. Ignoring start request.");
      return;
    }

    try {
      this.state.start();
      await this.engine.initialize("app", GameConfig, this.state, this.logger);
      
      this.isRunning = true;
      this.state.emit("initialized", this.state.grid);
      this.state.debugSummary();
      
      this.logger.info("Game started successfully");
    } catch (error) {
      this.logger.error("Failed to start game", error);
      throw error;
    }
  }

  /**
   * Stops the game and cleans up resources.
   * Safe to call even if game is not running.
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn("Game not running. Ignoring stop request.");
      return;
    }

    try {
      this.engine.destroy();
      this.state.stop();
      this.isRunning = false;
      
      this.logger.info("Game stopped successfully");
    } catch (error) {
      this.logger.error("Error during game shutdown", error);
      throw error;
    }
  }

  /**
   * Gets the current running state of the game.
   */
  get running(): boolean {
    return this.isRunning;
  }
}