import Phaser from "phaser";
import fontUrl from "../../../assets/fonts/Jersey10-Regular.ttf";
import { Difficulty, DifficultyConfig } from "../../../config/DifficultyConfig";
import { SceneTransitionManager } from "../utils/SceneTransitionManager";
import { UIContainerManager } from "../utils/UIContainerManager";
import { PhaserAssetLoader } from "../PhaserAssetLoader";
import { AnimationManager } from "../utils/AnimationManager";
import { ButtonFactory } from "../utils/ButtonFactory";
import { UIConfig } from "../../../config/UIConfig";
import { loadTTF } from "../../../core/utils";
import { Logger } from "../../../core/logging/Logger";

import type { IGameConfig } from "../../../config/GameConfig";


/**
 * Menu scene for difficulty selection and game start.
 * Follows proper Phaser lifecycle: init -> preload -> create
 */
export class MenuScene extends Phaser.Scene {
  private assetLoader!: PhaserAssetLoader;
  private logger!: Logger;
  private animationManager!: AnimationManager;
  private transitionManager!: SceneTransitionManager;
  private buttonFactory!: ButtonFactory;

  private ui!: UIContainerManager;
  private background!: Phaser.GameObjects.TileSprite;

  private selectedDifficulty: Difficulty = Difficulty.Medium;
  private difficultyButtons: Map<Difficulty, Phaser.GameObjects.Container> = new Map();

  private fontLoaded = false;
  private isSceneAlive = true;

  constructor() {
    super({ key: "MenuScene" });
  }

  init(): void {
    const logLevel = (import.meta.env.VITE_LOG_LEVEL as string) ?? "info";
    this.logger = new Logger(logLevel);
    this.animationManager = new AnimationManager(this, this.logger);
    this.transitionManager = new SceneTransitionManager(this);
    this.buttonFactory = new ButtonFactory(this);

    this.logger.info("MenuScene initialized");
  }

  preload(): void {
    this.assetLoader = new PhaserAssetLoader(this, this.logger);
    this.assetLoader.loadAll();

    // Load TTF with our helper. We don't block Phaser's loader on this but we wait
    // for the font when creating the UI so visuals don't flash.
    loadTTF('Jersey10', fontUrl)
      .then(() => {
        this.fontLoaded = true;
        this.logger.debug("Font loaded successfully");
      })
      .catch((err) => {
        this.logger.error("Failed to load font", err);
        // allow UI to proceed on failure
        this.fontLoaded = true;
      });

    // Wait for Phaser asset loading to complete.
    this.load.once("complete", () => this.onLoadComplete());
  }

  create(): void {
    // Setup UI containers (fixed + dynamic), responsive listener and background.
    this.ui = new UIContainerManager(this);
    this.scale.on("resize", this.handleResize, this);

    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, "tile-background")
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(UIConfig.DEPTH.BACKGROUND);
  }

  private onLoadComplete(): void {
    // Ensure we are alive (scene may have been stopped) and that the font either loaded
    // or we wait a short grace period for it. We avoid an indefinite wait.
    if (!this.isSceneAlive) return;

    // If font isn't ready yet, wait a small amount but don't block forever.
    const ensureFontThenCreate = () => {
      if (this.fontLoaded) {
        this.createMenuUI();
      } else {
        // wait up to ~250ms total in 50ms steps then proceed
        const attempts = 5;
        let tries = 0;
        const waiter = this.time.addEvent({
          delay: 50,
          loop: true,
          callback: () => {
            tries++;
            if (this.fontLoaded || tries >= attempts) {
              waiter.remove();
              this.createMenuUI();
            }
          }
        });
      }
    };

    // Small delay to allow texture atlases/animations to become immediately playable
    this.time.delayedCall(25, ensureFontThenCreate);
  }

  private createMenuUI(): void {
    // Defensive: ensure ui exists
    if (!this.ui) this.ui = new UIContainerManager(this);

    this.animationManager.createMenuAnimations();

    // Title
    this.createTitle(0, UIConfig.LAYOUT.TITLE_OFFSET_Y);

    // Start button
    this.createStartButton(0, UIConfig.LAYOUT.START_BUTTON_OFFSET_Y);

    // Difficulty buttons
    this.createDifficultyButtons(0, UIConfig.LAYOUT.DIFFICULTY_OFFSET_Y);

    // Credits
    this.createCredits();

    // Intro fade
    this.transitionManager.fadeIn();
  }

  private createTitle(x: number, y: number): void {
    const titlePanel = this.add.sprite(x, y, "menu-title-1")
      .setOrigin(0.5)
      .setDepth(UIConfig.DEPTH.UI_BASE);

    // If animation exists, play it safely
    if (titlePanel.anims && this.anims.exists("menu-anim")) {
      titlePanel.play("menu-anim");
    }

    this.ui.addDynamic(titlePanel);
  }

  private createStartButton(x: number, y: number): void {
    const startButton = this.buttonFactory.createStartButton(x, y, () => void this.startGame());
    this.ui.addDynamic(startButton);
  }

  private createDifficultyButtons(centerX: number, buttonY: number): void {
    const difficulties: Difficulty[] = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
    const spacing = UIConfig.LAYOUT.DIFFICULTY_SPACING;

    difficulties.forEach((difficulty, index) => {
      const offsetX = (index - 1) * (spacing / 2);
      const label = difficulty.toUpperCase();

      const button = this.buttonFactory.createPanelButton(
        centerX + offsetX,
        buttonY,
        label,
        () => this.setDifficulty(difficulty)
      );

      this.difficultyButtons.set(difficulty, button);
      this.ui.addDynamic(button);
    });

    this.setDifficulty(this.selectedDifficulty);
  }

  private createCredits(): void {
    const credits = this.add.text(
      0,
      UIConfig.LAYOUT.CREDITS_OFFSET_Y,
      "Game made by Sergio Marchena\nSprites made by Pablo Cáceres",
      {
        fontSize: UIConfig.TEXT.CREDIT_SIZE,
        color: UIConfig.TEXT.COLOR_LIGHT,
        fontFamily: UIConfig.TEXT.FONT_FAMILY,
        align: "center"
      }
    )
      .setOrigin(0.5, 0.5)
      .setDepth(UIConfig.DEPTH.UI_BASE);

    this.ui.addDynamic(credits);
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

    // Add the scene to Phaser if it hasn't been added yet
    if (!this.scene.get("MainScene")) {
      // Dynamically load MainScene
      const loadMainScene = (window as any).loadMainScene as () => Promise<any>;
      const MainSceneClass = await loadMainScene();
      this.scene.add("MainScene", MainSceneClass, false);
    }

    await this.transitionManager.transitionTo("MainScene", { config, logger: this.logger });
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
    const { centerX, centerY } = this.ui.getCenter();
    this.add.text(centerX, centerY + 200, message, {
      fontFamily: UIConfig.TEXT.FONT_FAMILY,
      fontSize: UIConfig.TEXT.ERROR_SIZE,
      color: UIConfig.TEXT.COLOR_ERROR
    })
      .setOrigin(0.5)
      .setDepth(UIConfig.DEPTH.UI_BASE);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.background.setSize(gameSize.width, gameSize.height);
    this.ui.reposition();
  }

  shutdown(): void {
    this.difficultyButtons.clear();
    this.isSceneAlive = false;
    this.scale.off("resize", this.handleResize, this);
    this.ui?.destroy();
    this.logger.debug("MenuScene shutdown complete");
  }
}