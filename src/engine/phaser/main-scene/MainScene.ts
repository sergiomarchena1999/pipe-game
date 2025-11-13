import Phaser from "phaser";
import { WorldContainer } from "../WorldContainer";
import { AssetRenderer } from "./AssetRenderer";
import { InputManager } from "./InputManager";
import { UIRenderer } from "./renderers/UIRenderer";
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

  private worldContainer!: WorldContainer;
  private assetRenderer!: AssetRenderer;
  private inputManager!: InputManager;
  private uiRenderer!: UIRenderer;

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
      this.state.flowNetwork,
      this.logger
    );

    this.subscribeToGameEvents();
    this.state.start();

    this.assetRenderer.renderGridBackground(this.state.grid);
    
    const queue = this.state.queue;
    queue.on("onUpdated", () => this.assetRenderer.renderQueue(queue));
    this.assetRenderer.renderQueue(queue);

    this.inputManager = new InputManager(
      this, 
      this.state, 
      this.assetRenderer, 
      this.logger
    );
    this.inputManager.initialize();

    this.uiRenderer = new UIRenderer(this, this.state, this.logger);
    this.uiRenderer.createBaseUI();

    // Handle UI events
    this.events.on("ui:backToMenu", () => this.returnToMenu());
  }

  update(_time: number, delta: number): void {
    const deltaTime = delta / 1000;
    this.state.update(deltaTime);
    this.assetRenderer.renderWaterFlow();
  }

  private subscribeToGameEvents(): void {
    this.state.once("onInitialized", (grid) => {
      const startPipe = grid.startPipe;
      this.assetRenderer.addPipe(startPipe);
    });

    this.state.on("onBombStarted", (pos, durationMs) => {
      this.assetRenderer.startBombAnimation(pos, durationMs, () => {
        this.logger.debug(`Bomb animation completed at ${pos}`);
      });
    });

    this.state.on("onBombCompleted", (newPipe) => {
      this.assetRenderer.removePipe(newPipe.position);
      this.assetRenderer.addPipe(newPipe);
    });

    // Score update event
    this.state.on("onScoreUpdated", (score, pipesFlowed) => {
      this.uiRenderer.updateScoreDisplay(score, pipesFlowed);
    });

    // Win event
    this.state.on("onGameWon", (finalScore, pipesFlowed) => {
      this.uiRenderer.showGameOverPanel(
        "winner-panel",
        finalScore,
        pipesFlowed,
        () => this.restartGame(),
        () => this.returnToMenu()
      );
    });

    // Lose event
    this.state.on("onGameLost", (finalScore, pipesFlowed) => {
      this.uiRenderer.showGameOverPanel(
        "loser-panel",
        finalScore,
        pipesFlowed,
        () => this.restartGame(),
        () => this.returnToMenu()
      );
    });
  }

  /** Restart current game with same configuration */
  private restartGame(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Restart with same config
      this.scene.restart({ config: this.config, logger: this.logger });
    });
  }

  /** Transition back to main menu */
  private returnToMenu(): void {
    this.state.stop();
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MenuScene");
    });
  }

  /** Clean up */
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