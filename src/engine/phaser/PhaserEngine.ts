import Phaser from "phaser";
import type { IGameEngine } from "../IGameEngine";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import { MainScene } from "./MainScene";


export class PhaserEngine implements IGameEngine {
  private game!: Phaser.Game;

  async initialize(containerId: string, config: IGameConfig, state: GameState): Promise<void> {
    const { canvas } = config;

    const mainScene = new MainScene(config, state);

    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: canvas.width,
      height: canvas.height,
      parent: containerId,
      backgroundColor: canvas.backgroundColor,
      scene: [mainScene],
      physics: { default: "arcade" },
    };

    this.game = new Phaser.Game(phaserConfig);
  }

  async preloadAssets(): Promise<void> {}

  start(): void {}

  addEntity(entity: any): void {}
  removeEntity(entity: any): void {}

  destroy(): void {
    this.game.textures.destroy();
    this.game.destroy(true);
  }
}