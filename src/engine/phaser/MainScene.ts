import Phaser from "phaser";
import { PhaserAssetLoader } from "./PhaserAssetLoader";
import { WorldContainer } from "./WorldContainer";
import { AssetRenderer } from "./AssetRenderer";
import { InputManager } from "./InputManager";

import type { IPhaserScene } from "./IPhaserScene";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import type { ILogger } from "../../core/logging/ILogger";

/** Main game scene responsible for rendering the grid and pipes. */
export class MainScene extends Phaser.Scene implements IPhaserScene {
  private assetLoader!: PhaserAssetLoader;
  private assetRenderer!: AssetRenderer;
  private inputManager!: InputManager;
  private worldContainer!: WorldContainer;

  constructor(
    private readonly config: IGameConfig,
    private readonly state: GameState,
    private readonly logger: ILogger
  ) {
    super({ key: "MainScene" });
  }

  preload(): void {
    this.assetLoader = new PhaserAssetLoader(this, this.logger);
    this.assetLoader.loadAll();
    this.assetLoader.startLoading();
  }

  create(): void {
    // Create world container first - all game elements will be added to this
    this.worldContainer = new WorldContainer(this, this.config);

    // Pass world container to renderer
    this.assetRenderer = new AssetRenderer(
      this, 
      this.config, 
      this.worldContainer,
      this.logger
    );

    this.inputManager = new InputManager(
      this, 
      this.state, 
      this.assetRenderer, 
      this.logger
    );

    this.assetRenderer.renderGridBackground(this.state.grid);
    this.subscribeToGameEvents();
    this.inputManager.initialize();

    const queue = this.state.queue;
    queue.on("updated", () => this.assetRenderer.renderQueue(queue));
    this.assetRenderer.renderQueue(queue);
  }

  update(_time: number, delta: number): void {
    const deltaTime = delta / 1000;
    this.state.update(deltaTime);
    this.assetRenderer.renderWaterFlow();
  }

  private subscribeToGameEvents(): void {
    this.state.once("initialized", (grid) => {
      const startPipe = grid.startPipe;
      this.assetRenderer.addPipe(startPipe);
    });

    // Handle bomb animations
    this.state.on("bombStarted", (cell, durationMs) => {
      this.assetRenderer.startBombAnimation(cell, durationMs, () => {
        // Animation completed on renderer side
        this.logger.debug(`Bomb animation completed at ${cell}`);
      });
    });

    this.state.on("bombCompleted", (newPipe) => {
      // Remove the pipe sprite after bomb completes
      this.assetRenderer.removePipe(newPipe.position);
      this.assetRenderer.addPipe(newPipe);
    });
  }

  shutdown(): void {
    this.worldContainer.destroy();
    this.assetRenderer.destroy();
  }
}