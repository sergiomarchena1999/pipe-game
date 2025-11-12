import Phaser from "phaser";
import { Difficulty, DifficultyConfig } from "../../../config/DifficultyConfig";
import { PhaserAssetLoader } from "../PhaserAssetLoader";
import { WorldContainer } from "../WorldContainer";
import { Logger } from "../../../core/logging/Logger";


export class MenuScene extends Phaser.Scene {
  private assetLoader!: PhaserAssetLoader;
  private worldContainer!: WorldContainer;
  private logger!: Logger;
  private selectedDifficulty: Difficulty = Difficulty.Medium;

  constructor() {
    super({ key: "MenuScene" });
  }

  init(): void {
    const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
    this.logger = new Logger(logLevel);
  }

  preload(): void {
    this.assetLoader = new PhaserAssetLoader(this, this.logger);
    this.assetLoader.loadAll();
    this.assetLoader.startLoading();
  }

  create(): void {
    // Use temporary config for menu layout
    const tempConfig = DifficultyConfig.get(Difficulty.Medium);
    this.worldContainer = new WorldContainer(this, tempConfig);

    // Compute center
    const { width: gridW, height: gridH } = this.worldContainer.getGridDimensions();
    const centerX = gridW / 2;
    const centerY = gridH / 2;

    // Title images
    const titlePipe = this.add
      .image(centerX, centerY - 120, "title-pipe")
      .setOrigin(0.5)
      .setDepth(2);

    const titleMania = this.add
      .image(centerX, centerY - 50, "title-mania")
      .setOrigin(0.5)
      .setDepth(2);

    this.worldContainer.add(titlePipe);
    this.worldContainer.add(titleMania);

    // Start button
    const startText = this.add.text(centerX, centerY + 50, "Start Game", {
      fontSize: "32px",
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(3);

    startText.setInteractive({ useHandCursor: true });
    startText.on("pointerdown", () => {
      this.startGame();
    });

    this.worldContainer.add(startText);

    // Difficulty buttons
    this.createDifficultyButtons(centerX, centerY + 130);

    // Fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createDifficultyButtons(centerX: number, buttonY: number): void {
    const difficulties: Difficulty[] = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
    const spacing = 300;
    const buttons: Record<string, Phaser.GameObjects.Text> = {};

    difficulties.forEach((difficulty, i) => {
      const offsetX = (i - 1) * (spacing / 2);
      const button = this.add.text(centerX + offsetX, buttonY, difficulty.toUpperCase(), {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 15, y: 8 },
      })
        .setOrigin(0.5)
        .setDepth(3)
        .setInteractive({ useHandCursor: true });

      button.on("pointerdown", () => {
        this.setDifficulty(difficulty, buttons);
      });

      buttons[difficulty] = button;
      this.worldContainer.add(button);
    });

    // Set initial selection
    this.setDifficulty(this.selectedDifficulty, buttons);
  }

  private setDifficulty(difficulty: Difficulty, buttons: Record<string, Phaser.GameObjects.Text>): void {
    this.selectedDifficulty = difficulty;

    // Update button styles
    Object.entries(buttons).forEach(([key, button]) => {
      if (key === difficulty) {
        button.setStyle({
          backgroundColor: "#ffff00",
          color: "#000000",
        });
      } else {
        button.setStyle({
          backgroundColor: "#000000",
          color: "#ffffff",
        });
      }
    });

    this.logger.info(`Selected difficulty: ${difficulty.toUpperCase()}`);
  }

  private startGame(): void {
    // Get the selected difficulty config
    const selectedConfig = DifficultyConfig.get(this.selectedDifficulty);

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Pass the config to MainScene via scene data
      this.scene.start("MainScene", { 
        config: selectedConfig,
        logger: this.logger 
      });
    });
  }

  shutdown(): void {
    if (this.worldContainer) {
      this.worldContainer.destroy();
    }
  }
}