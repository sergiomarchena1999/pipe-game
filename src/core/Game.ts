import { GameState } from "./GameState";
import type { Logger } from "../utils/Logger";

/**
 * The main game runtime. Orchestrates update/render loops and delegates logic to subsystems.
 */
export class Game {
  private readonly logger: Logger;
  private readonly state: GameState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.state = new GameState(8, 8, this.logger);
  }

  /**
   * Starts the main game loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.state.start();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    this.logger.info("Game loop started");
  }

  /**
   * Stops (pauses) the game loop.
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.state.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.logger.info("Game loop stopped");
  }

  /**
   * The main update-render loop.
   */
  private loop = (time: number): void => {
    if (!this.running) return;

    const deltaTime = (time - this.lastTime) / 1000; // seconds
    this.lastTime = time;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Updates game logic (delegates to GameState and submodules).
   */
  private update(deltaTime: number): void {
    // Future: input, animations, grid logic, etc.
    if (this.state.isActive()) {
      // Example: check pipes, flow water, etc.
      // this.state.update(deltaTime);
    }
  }

  /**
   * Renders the game (abstracted: could be Canvas, Pixi, Phaser, etc.).
   */
  private render(): void {
    // Future: delegate to a Renderer instance (Canvas or Pixi)
    // e.g. this.renderer.draw(this.state.grid);
  }

  /**
   * Used for debugging or restarting the session manually.
   */
  reset(): void {
    this.state.reset();
  }
}