import Phaser from "phaser";
import { WorldContainer } from "../WorldContainer";
import { AssetRenderer } from "./AssetRenderer";
import { InputManager } from "./InputManager";
import { GameState } from "../../../core/GameState";

import type { IGameConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../../core/logging/ILogger";

interface MainSceneData {
  config: IGameConfig;
  logger: ILogger;
}

/**
 * Main game scene responsible for rendering the grid and pipes.
 * Receives configuration from MenuScene and creates GameState on demand.
 */
export class MainScene extends Phaser.Scene {
  private config!: IGameConfig;
  private logger!: ILogger;
  private state!: GameState;
  
  private assetRenderer!: AssetRenderer;
  private inputManager!: InputManager;
  private worldContainer!: WorldContainer;

  constructor() {
    super({ key: "MainScene" });
  }

  /**
   * Receives config and logger from MenuScene
   */
  init(data: MainSceneData): void {
    if (!data.config || !data.logger) {
      throw new Error("MainScene requires config and logger from MenuScene");
    }

    this.config = data.config;
    this.logger = data.logger;

    // Create GameState with the selected difficulty config
    this.state = new GameState(this.config, this.logger);
    
    this.logger.info(`MainScene initialized with difficulty: ${this.config.difficulty}`);
  }

  create(): void {
    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.worldContainer = new WorldContainer(this, this.config);

    this.assetRenderer = new AssetRenderer(
      this, 
      this.config, 
      this.worldContainer,
      this.logger
    );

    this.subscribeToGameEvents();
    this.state.start();

    this.assetRenderer.renderGridBackground(this.state.grid);
    
    const queue = this.state.queue;
    queue.on("updated", () => this.assetRenderer.renderQueue(queue));
    this.assetRenderer.renderQueue(queue);

    this.inputManager = new InputManager(
      this, 
      this.state, 
      this.assetRenderer, 
      this.logger
    );
    this.inputManager.initialize();

    this.createBackButton();
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

    this.state.on("bombStarted", (cell, durationMs) => {
      this.assetRenderer.startBombAnimation(cell, durationMs, () => {
        this.logger.debug(`Bomb animation completed at ${cell}`);
      });
    });

    this.state.on("bombCompleted", (newPipe) => {
      this.assetRenderer.removePipe(newPipe.position);
      this.assetRenderer.addPipe(newPipe);
    });
  }

  private createBackButton(): void {
    const backButton = this.add.text(this.cameras.main.width - 20, 20, "Back to Menu", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 12, y: 6 },
    })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setScrollFactor(0) // Keep fixed on screen
      .setInteractive({ useHandCursor: true });

    backButton.on("pointerdown", () => {
      this.returnToMenu();
    });
  }

  private returnToMenu(): void {
    this.state.stop();
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MenuScene");
    });
  }

  shutdown(): void {
    if (this.state) {
      this.state.stop();
    }
    if (this.worldContainer) {
      this.worldContainer.destroy();
    }
    if (this.assetRenderer) {
      this.assetRenderer.destroy();
    }
  }
}