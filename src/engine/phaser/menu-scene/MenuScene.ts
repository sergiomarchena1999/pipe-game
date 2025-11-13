import Phaser from "phaser";
import { Difficulty, DifficultyConfig } from "../../../config/DifficultyConfig";
import { PhaserAssetLoader } from "../PhaserAssetLoader";
import { createPanelButton } from "../utils";
import { WorldContainer } from "../WorldContainer";
import { Logger } from "../../../core/logging/Logger";
import { loadTTF } from "../../../core/utils";

import type { IGameConfig } from "../../../config/GameConfig";


export class MenuScene extends Phaser.Scene {
  private assetLoader!: PhaserAssetLoader;
  private worldContainer!: WorldContainer;
  private logger!: Logger;
  private selectedDifficulty: Difficulty = Difficulty.Medium;
  private loadFontPromise!: Promise<void>;

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

    this.loadFontPromise = loadTTF('Jersey10', 'src/assets/fonts/Jersey10-Regular.ttf');
  }

  async create(): Promise<void> {
    // Wait for font to finish loading
    await this.loadFontPromise;

    const tempConfig = this.getConfig();
    if (!tempConfig) return;

    this.worldContainer = new WorldContainer(this, tempConfig);
    const { width: gridW, height: gridH } = this.worldContainer.getGridDimensions();
    const centerX = gridW / 2;
    const centerY = gridH / 2;

    const titlePanel = this.add.sprite(centerX, centerY - 130, "menu-title-1")
      .setOrigin(0.5)
      .setDepth(2);
    this.worldContainer.add(titlePanel);

    // Create the animation if it doesn't exist
    if (!this.anims.exists("menu-anim")) {
      this.anims.create({
        key: "menu-anim",
        frames: [
          { key: "menu-title-1" },
          { key: "menu-title-2" }
        ],
        frameRate: 3,
        repeat: -1
      });
    }

    // Play the animation
    titlePanel.play("menu-anim");

    this.worldContainer.add(titlePanel);

    const startButton = createPanelButton(centerX, centerY + 50, "Start Game", () => this.startGame(), this);
    this.worldContainer.add(startButton);

    // Difficulty buttons
    this.createDifficultyButtons(centerX, centerY + 130);

    // Fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  shutdown(): void {
    this.worldContainer?.destroy();
  }

  private createDifficultyButtons(centerX: number, buttonY: number): void {
    const difficulties: Difficulty[] = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];
    const spacing = 300;
    const buttons: Record<string, Phaser.GameObjects.Container> = {};

    difficulties.forEach((difficulty, i) => {
      const offsetX = (i - 1) * (spacing / 2);
      const button = createPanelButton(
        centerX + offsetX,
        buttonY,
        difficulty.toUpperCase(),
        () => this.setDifficulty(difficulty, buttons),
        this
      );

      buttons[difficulty] = button;
      this.worldContainer.add(button);
    });

    this.setDifficulty(this.selectedDifficulty, buttons);
  }

  private setDifficulty(difficulty: Difficulty, buttons: Record<string, Phaser.GameObjects.Container>): void {
    this.selectedDifficulty = difficulty;

    Object.entries(buttons).forEach(([key, container]) => {
      const sprite = container.list.find(child => child instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
      if (key === difficulty) {
        sprite.setTexture("button-blue"); // selected button sprite
      } else {
        sprite.setTexture("button-orange"); // default button sprite
      }
    });

    this.logger.info(`Selected difficulty: ${difficulty.toUpperCase()}`);
  }

  private startGame(): void {
    const config = this.getConfig();
    if (!config) return;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MainScene", { config, logger: this.logger });
    });
  }

  private getConfig(): IGameConfig | null {
    const result = DifficultyConfig.getConfig(this.selectedDifficulty);
    if (!result.success) {
      this.logger.error(`Failed to start game: ${result.error}`);
      this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 200,
        `Error loading config: ${result.error}`, 
        { fontFamily: 'Jersey10', fontSize: "20px", color: "#ff0000" })
        .setOrigin(0.5)
        .setDepth(5);
      return null;
    }
    return result.value;
  }
}