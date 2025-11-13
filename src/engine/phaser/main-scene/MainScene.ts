import Phaser from "phaser";
import { WorldContainer } from "../WorldContainer";
import { AssetRenderer } from "./AssetRenderer";
import { InputManager } from "./InputManager";
import { UIRenderer } from "./renderers/UIRenderer";
import { GameState } from "../../../core/GameState";
import { SceneTransitionManager } from "../utils/SceneTransitionManager";
import { AnimationManager } from "../utils/AnimationManager";

import type { IGameConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../../core/logging/ILogger";
import type { GridPosition } from "../../../core/domain/grid/GridPosition";

interface MainSceneData {
  readonly config: IGameConfig;
  readonly logger: ILogger;
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
  private transitionManager!: SceneTransitionManager;
  private animationManager!: AnimationManager;

  constructor() {
    super({ key: "MainScene" });
  }

  /** Receives config and logger from MenuScene */
  init(data: MainSceneData): void {
    if (!data?.config || !data?.logger) {
      throw new Error("MainScene requires config and logger from MenuScene");
    }

    this.config = data.config;
    this.logger = data.logger;
    this.transitionManager = new SceneTransitionManager(this);
    this.animationManager = new AnimationManager(this, this.logger);

    // Create GameState with the selected difficulty config
    this.state = new GameState(this.config, this.logger);

    this.logger.info(`MainScene initialized with difficulty: ${this.config.difficulty}`);
  }

  create(): void {
    // Fade in from black
    this.transitionManager.fadeIn();

    // Create animations
    this.animationManager.createGameAnimations();

    // Initialize world container
    this.worldContainer = new WorldContainer(this, this.config);

    // Initialize asset renderer
    this.assetRenderer = new AssetRenderer(
      this,
      this.config,
      this.worldContainer,
      this.state.flowNetwork,
      this.logger
    );

    // Subscribe to game events
    this.subscribeToGameEvents();

    // Start the game
    this.state.start();

    // Render initial state
    this.renderInitialState();

    // Initialize input handling
    this.inputManager = new InputManager(
      this,
      this.state,
      this.assetRenderer,
      this.logger
    );
    this.inputManager.initialize();

    // Initialize UI
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

  private renderInitialState(): void {
    // Render grid background
    this.assetRenderer.renderGridBackground(this.state.grid);

    // Setup queue rendering
    const queue = this.state.queue;
    queue.on("onUpdated", () => this.assetRenderer.renderQueue(queue));
    this.assetRenderer.renderQueue(queue);
  }

  private subscribeToGameEvents(): void {
    this.state.once("onInitialized", (grid) => {
      const startPipe = grid.startPipe;
      this.assetRenderer.addPipe(startPipe);
    });

    this.state.on("onBombStarted", (pos: GridPosition, durationMs: number) => {
      this.assetRenderer.startBombAnimation(pos, durationMs, () => {
        this.logger.debug(`Bomb animation completed at ${pos}`);
      });
    });

    this.state.on("onBombCompleted", (newPipe) => {
      this.assetRenderer.removePipe(newPipe.position);
      this.assetRenderer.addPipe(newPipe);
    });

    this.state.on("onScoreUpdated", (score: number, pipesFlowed: number) => {
      this.uiRenderer.updateScoreDisplay(score, pipesFlowed);
    });

    this.state.on("onGameWon", (finalScore: number, pipesFlowed: number) => {
      this.handleGameEnd("winner-panel", finalScore, pipesFlowed);
    });

    this.state.on("onGameLost", (finalScore: number, pipesFlowed: number) => {
      this.handleGameEnd("loser-panel", finalScore, pipesFlowed);
    });
  }

  private handleGameEnd(
    panelKey: "winner-panel" | "loser-panel",
    finalScore: number,
    pipesFlowed: number
  ): void {
    // Disable input
    this.inputManager.disable();

    // Show game over panel
    this.uiRenderer.showGameOverPanel(
      panelKey,
      finalScore,
      pipesFlowed,
      () => this.restartGame(),
      () => this.returnToMenu()
    );
  }

  /** Restart current game with same configuration */
  private async restartGame(): Promise<void> {
    await this.transitionManager.restart({
      config: this.config,
      logger: this.logger
    });
  }

  /** Transition back to main menu */
  private async returnToMenu(): Promise<void> {
    this.state.stop();
    await this.transitionManager.transitionTo("MenuScene");
  }

  /** Clean up all resources */
  shutdown(): void {
    this.logger.debug("MainScene shutting down");

    // Remove event listeners
    this.events.off("ui:backToMenu");

    // Stop game state
    if (this.state) {
      this.state.stop();
      this.state.removeAllListeners();
    }

    // Destroy managers in reverse order of creation
    if (this.inputManager) {
      this.inputManager.destroy();
    }

    if (this.uiRenderer) {
      this.uiRenderer.destroy();
    }

    if (this.assetRenderer) {
      this.assetRenderer.destroy();
    }

    if (this.worldContainer) {
      this.worldContainer.destroy();
    }

    this.logger.debug("MainScene shutdown complete");
  }
}