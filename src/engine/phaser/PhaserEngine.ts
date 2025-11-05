import Phaser from "phaser";
import type { IGameEngine } from "../IGameEngine";


export class PhaserEngine implements IGameEngine {
  private game!: Phaser.Game;

  async initialize(containerId: string): Promise<void> {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerId,
      // scene: [MainScene],
    };

    this.game = new Phaser.Game(config);
  }

  async preloadAssets(): Promise<void> {
    // Aquí podrías cargar imágenes, audio, atlas, etc.
    // (En Phaser, esto realmente lo hace una Scene)
  }

  start(): void {
    // Arrancar escena principal o lógica del juego
  }

  addEntity(entity: any): void {
    // Añadir sprite, UI, etc.
  }

  removeEntity(entity: any): void {
    // Eliminar entidad del escenario
  }

  destroy(): void {
    this.game.destroy(true);
  }
}