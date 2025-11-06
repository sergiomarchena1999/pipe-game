import Phaser from "phaser";
import type { IGameEngine } from "../IGameEngine";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import type { ILogger } from "../../core/logging/ILogger";
import { MainScene } from "./MainScene";

/**
 * Phaser-based rendering engine implementation.
 * Handles all graphics rendering and game loop management.
 */
export class PhaserEngine implements IGameEngine {
  private game: Phaser.Game | null = null;

  /**
   * Initializes the Phaser game engine with the specified configuration.
   * @throws {Error} if initialization fails
   */
  async initialize(
    containerId: string,
    config: IGameConfig,
    state: GameState,
    logger: ILogger
  ): Promise<void> {
    if (this.game) {
      throw new Error("Engine already initialized");
    }

    try {
      const mainScene = new MainScene(config, state, logger);
      const phaserConfig = this.createPhaserConfig(containerId, config, mainScene);

      this.game = new Phaser.Game(phaserConfig);

      await this.waitForSceneReady();
      logger.info("Phaser engine initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Phaser engine", error);
      throw error;
    }
  }

  /**
   * Destroys the game engine and cleans up all resources.
   */
  destroy(): void {
    if (!this.game) {
      return;
    }

    try {
      this.game.textures.destroy();
      this.game.destroy(true);
      this.game = null;
    } catch (error) {
      console.error("Error during engine destruction:", error);
    }
  }

  private createPhaserConfig(containerId: string, config: IGameConfig, scene: Phaser.Scene): Phaser.Types.Core.GameConfig {
    return {
      type: Phaser.AUTO,
      width: config.canvas.width,
      height: config.canvas.height,
      parent: containerId,
      backgroundColor: config.canvas.backgroundColor,
      scene: [scene],
      physics: { 
        default: "arcade",
        arcade: {
          debug: false
        }
      },
      render: {
        antialias: true,
        pixelArt: false,
      }
    };
  }

  private waitForSceneReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.game) {
        reject(new Error("Game instance not available"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Scene initialization timeout"));
      }, 10000); // 10 second timeout

      this.game.events.once(Phaser.Core.Events.READY, () => {
        const mainScene = this.game!.scene.getScene("MainScene") as MainScene;

        if (!mainScene) {
          clearTimeout(timeout);
          reject(new Error("MainScene not found"));
          return;
        }

        mainScene.events.once(Phaser.Scenes.Events.CREATE, () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    });
  }
}