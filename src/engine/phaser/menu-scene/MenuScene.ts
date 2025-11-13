import Phaser from "phaser";
import fontUrl from '../../../assets/fonts/Jersey10-Regular.ttf';
import { Difficulty, DifficultyConfig } from "../../../config/DifficultyConfig";
import { UIConfig } from "../../../config/UIConfig";
import { PhaserAssetLoader } from "../PhaserAssetLoader";
import { WorldContainer } from "../WorldContainer";
import { Logger } from "../../../core/logging/Logger";
import { loadTTF } from "../../../core/utils";
import { AnimationManager } from "../utils/AnimationManager";
import { SceneTransitionManager } from "../utils/SceneTransitionManager";
import { ButtonFactory } from "../utils/ButtonFactory";

import type { IGameConfig } from "../../../config/GameConfig";

/**
 * Menu scene for difficulty selection and game start.
 * Follows proper Phaser lifecycle: init -> preload -> create
 */
export class MenuScene extends Phaser.Scene {
  private assetLoader!: PhaserAssetLoader;
  private worldContainer!: WorldContainer;
  private logger!: Logger;
  private animationManager!: AnimationManager;
  private transitionManager!: SceneTransitionManager;
  private buttonFactory!: ButtonFactory;

  private selectedDifficulty: Difficulty = Difficulty.Medium;
  private difficultyButtons: Map<Difficulty, Phaser.GameObjects.Container> = new Map();
  private fontLoaded = false;

  constructor() {
    super({ key: "MenuScene" });
  }

  init(): void {
    const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
    this.logger = new Logger(logLevel);
    this.animationManager = new AnimationManager(this, this.logger);
    this.transitionManager = new SceneTransitionManager(this);
    this.buttonFactory = new ButtonFactory(this);

    this.logger.info("MenuScene initialized");
  }

  preload(): void {
    this.assetLoader = new PhaserAssetLoader(this, this.logger);
    this.assetLoader.loadAll();

    // Load font asynchronously
    loadTTF('Jersey10', fontUrl)
      .then(() => {
        this.fontLoaded = true;
        this.logger.debug("Font loaded successfully");
      })
      .catch(err => {
        this.logger.error("Failed to load font", err);
        this.fontLoaded = true; // Continue anyway
      });

    // Wait for both assets and font to complete
    this.load.once('complete', () => this.onLoadComplete());
  }

  private onLoadComplete(): void {
    // Wait a frame for font to be ready
    this.time.delayedCall(100, () => {
      if (this.fontLoaded) {
        this.createMenuUI();
      }
    });
  }

  create(): void {
    // Empty - actual creation happens in onLoadComplete
    // This ensures proper sequencing
  }

  private createMenuUI(): void {
    const tempConfig = this.getConfig();
    if (!tempConfig) return;

    this.worldContainer = new WorldContainer(this, tempConfig);
    const { width: gridW, height: gridH } = this.worldContainer.getGridDimensions();
    const centerX = gridW / 2;
    const centerY = gridH / 2;

    // Create animations
    this.animationManager.createMenuAnimations();

    // Create and animate title
    this.createTitle(centerX, centerY + UIConfig.LAYOUT.TITLE_OFFSET_Y);

    // Create start button
    this.createStartButton(centerX, centerY + UIConfig.LAYOUT.START_BUTTON_OFFSET_Y);

    // Create difficulty selection
    this.createDifficultyButtons(centerX, centerY + UIConfig.LAYOUT.DIFFICULTY_OFFSET_Y);

    // Create credits
    this.createCredits();

    // Fade in
    this.transitionManager.fadeIn();
  }

  private createTitle(x: number, y: number): void {
    const titlePanel = this.add.sprite(x, y, "menu-title-1")
      .setOrigin(0.5)
      .setDepth(UIConfig.DEPTH.UI_BASE);

    titlePanel.play("menu-anim");
    this.worldContainer.add(titlePanel);
  }

  private createStartButton(x: number, y: number): void {
    const startButton = this.buttonFactory.createStartButton(x, y, () => this.startGame());
    this.worldContainer.add(startButton);
  }

  private createDifficultyButtons(centerX: number, buttonY: number): void {
    const difficulties: Difficulty[] = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
    const buttonSpacing = UIConfig.LAYOUT.DIFFICULTY_SPACING;

    difficulties.forEach((difficulty, index) => {
      const offsetX = (index - 1) * (buttonSpacing / 2);
      const button = this.buttonFactory.createPanelButton(
        centerX + offsetX,
        buttonY,
        difficulty.toUpperCase(),
        () => this.setDifficulty(difficulty)
      );

      this.difficultyButtons.set(difficulty, button);
      this.worldContainer.add(button);
    });

    // Set initial selection
    this.setDifficulty(this.selectedDifficulty);
  }

  private createCredits(): void {
    const containerBounds = this.worldContainer.getContainerBounds();
    const credits = this.add.text(
        0,
        containerBounds.bottom,
        "Game made by Sergio Marchena, sprites by Pablo Cáceres",
        {
          fontSize: UIConfig.TEXT.CREDIT_SIZE,
          color: UIConfig.TEXT.COLOR_LIGHT,
          fontFamily: UIConfig.TEXT.FONT_FAMILY,
          align: "center"
        }
      )
      .setOrigin(0, 0)
      .setDepth(UIConfig.DEPTH.UI_BASE);

    this.worldContainer.add(credits);
  }

  private setDifficulty(difficulty: Difficulty): void {
    this.selectedDifficulty = difficulty;

    // Update button visuals
    this.difficultyButtons.forEach((button, key) => {
      const spriteKey = key === difficulty
        ? UIConfig.BUTTON.SELECTED_SPRITE
        : UIConfig.BUTTON.DEFAULT_SPRITE;

      this.buttonFactory.updateButtonSprite(button, spriteKey);
    });

    this.logger.info(`Selected difficulty: ${difficulty.toUpperCase()}`);
  }

  private async startGame(): Promise<void> {
    const config = this.getConfig();
    if (!config) return;

    await this.transitionManager.transitionTo("MainScene", {
      config,
      logger: this.logger
    });
  }

  private getConfig(): IGameConfig | null {
    const result = DifficultyConfig.getConfig(this.selectedDifficulty);
    if (!result.success) {
      this.logger.error(`Failed to get config: ${result.error}`);
      this.showError(`Error loading config: ${result.error}`);
      return null;
    }
    return result.value;
  }

  private showError(message: string): void {
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 200,
      message,
      {
        fontFamily: UIConfig.TEXT.FONT_FAMILY,
        fontSize: "20px",
        color: UIConfig.TEXT.COLOR_ERROR
      }
    )
      .setOrigin(0.5)
      .setDepth(UIConfig.DEPTH.UI_BASE);
  }

  shutdown(): void {
    this.difficultyButtons.clear();
    this.worldContainer?.destroy();
    this.logger.debug("MenuScene shutdown complete");
  }
}