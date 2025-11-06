import type { Logger } from "../utils/Logger";
import { GameState } from "./GameState";
import { GameConfig } from "../config/GameConfig";
import { PhaserEngine } from "../engine/phaser/PhaserEngine";


export class Game {
  private readonly logger: Logger;
  private readonly state: GameState;
  private readonly engine: PhaserEngine;
  private running: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.state = new GameState(
      GameConfig.grid.width,
      GameConfig.grid.height,
      this.logger
    );

    this.engine = new PhaserEngine(); 
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    await this.engine.initialize("app", GameConfig, this.state);

    this.state.start();
    this.state.debugSummary();
  }

  stop(): void {
    if (!this.running) return;
    this.engine.destroy();
    this.running = false;

    this.logger.info("Game stopped");
  }
}