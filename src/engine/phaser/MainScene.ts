import Phaser from "phaser";
import { PhaserAssetLoader } from "./PhaserAssetLoader";
import { AssetRenderer } from "./AssetRenderer";
import { InputManager } from "./InputManager";

import type { IPhaserScene } from "./IPhaserScene";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import type { ILogger } from "../../core/logging/ILogger";


/**
 * Main game scene responsible for rendering the grid and pipes.
 * Subscribes to game state events to update the display.
 */
export class MainScene extends Phaser.Scene implements IPhaserScene {
  private assetLoader!: PhaserAssetLoader;
  private assetRenderer!: AssetRenderer;
  private inputManager!: InputManager;

  constructor(
    private readonly config: IGameConfig,
    private readonly state: GameState,
    private readonly logger: ILogger
  ) {
    super({ key: "MainScene" });
  }

  /**
   * Phaser lifecycle: Load all required assets.
   */
  preload(): void {
    this.assetLoader = new PhaserAssetLoader(this, this.logger);
    this.assetLoader.loadAll();
    this.assetLoader.startLoading();
  }

  /**
   * Phaser lifecycle: Set up the initial scene.
   */
  create(): void {
    this.assetRenderer = new AssetRenderer(this, this.config, this.logger);
    this.inputManager = new InputManager(this, this.state, this.assetRenderer, this.logger);

    this.assetRenderer.renderGridBackground();
    this.subscribeToGameEvents();
    this.inputManager.initialize();

    const queue = this.state.queue;
    queue.on("updated", () => this.assetRenderer.renderQueue(queue));
    this.assetRenderer.renderQueue(queue);
  }

  /**
   * Sets up event listeners for game state changes.
   */
  private subscribeToGameEvents(): void {
    this.state.once("initialized", (grid) => {
      const startPipe = grid.startPipe;
      this.logger.info(
        `Rendering start pipe at (${startPipe.position.x}, ${startPipe.position.y}) ` +
        `with direction ${startPipe.direction}`
      );
      this.assetRenderer.renderPipe(startPipe);
    });
  }
}