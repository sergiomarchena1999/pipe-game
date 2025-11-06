import type { ILogger } from "../../core/logging/ILogger";
import type { IPhaserScene } from "./IPhaserScene";

/**
 * Gestor centralizado de assets para Phaser.
 * Evita recargar o registrar texturas duplicadas.
 */
export class PhaserAssetLoader {
  constructor(private readonly scene: IPhaserScene, private readonly logger: ILogger) { }

  /**
   * Carga una imagen si no existe todavía.
   * @param key - clave única del asset
   * @param path - ruta al archivo
   */
  loadImage(key: string, path: string): void {
    const { textures, load } = this.scene;
    if (!textures.exists(key)) {
      load.image(key, path);
    } else {
      this.logger.debug(`[AssetLoader] Skipped duplicate texture: ${key}`);
    }
  }

  /**
   * Carga múltiples imágenes a la vez.
   */
  loadImages(assets: Record<string, string>): void {
    for (const [key, path] of Object.entries(assets)) {
      this.loadImage(key, path);
    }
  }

  /**
   * Llama al start del Loader de Phaser.
   */
  startLoading(): void {
    this.scene.load.start();
  }
}