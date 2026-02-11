import type { ILogger } from "../../core/logging/ILogger";
import type { IPhaserScene } from "./IPhaserScene";


/**
 * Centralized asset manager for Phaser.
 * Ensures no duplicate textures are registered and provides
 * a self-contained registry of all default game assets.
 */
export class PhaserAssetLoader {
  /**
   * Default asset registry.
   * Maps logical keys to file paths.
   */
  private static readonly ASSETS = {
    "tile-background": "assets/tile-background.png",
    "winner-panel": "assets/ui/winner-panel.png",
    "loser-panel": "assets/ui/loser-panel.png",
    "button-blue": "assets/ui/button-blue.png",
    "button-orange": "assets/ui/button-orange.png",
    "button-start": "assets/ui/button-start.png",
    "button-start-hover": "assets/ui/button-start-hover.png",
    "menu-title-1": "assets/menu/menu-title-1.png",
    "menu-title-2": "assets/menu/menu-title-2.png",
    "bomb-idle": "assets/bomb/bomb-idle.png",
    "bomb-explosion-1": "assets/bomb/bomb-explosion-1.png",
    "bomb-explosion-2": "assets/bomb/bomb-explosion-2.png",
    "grid-cell": "assets/grid/grid-background.png",
    "grid-block": "assets/grid/grid-block.png",
    "grid-border-side": "assets/grid/grid-border-side.png",
    "grid-border-corner": "assets/grid/grid-border-corner.png",
    "grid-cursor": "assets/grid/grid-cursor.png",
    "grid-cursor-alt": "assets/grid/grid-cursor-alt.png",
    "queue-selected": "assets/queue/queue-selected.png",
    "queue-corner": "assets/queue/queue-corner.png",
    "queue-side": "assets/queue/queue-side.png",
    "pipe-straight": "assets/pipes/pipe-straight.png",
    "pipe-corner": "assets/pipes/pipe-corner.png",
    "pipe-cross": "assets/pipes/pipe-cross.png",
    "pipe-start": "assets/pipes/pipe-start.png",
  } as const;

  constructor(
    private readonly scene: IPhaserScene,
    private readonly logger: ILogger
  ) {}

  /** Loads all registered assets. */
  loadAll(): void {
    this.logger.debug("[AssetLoader] Starting to load all assets");
    this.loadImages(PhaserAssetLoader.ASSETS);
  }

  /**
   * Loads a single image if it hasn't been loaded yet.
   * @param key - Unique asset key
   * @param path - File path
   */
  private loadImage(key: string, path: string): void {
    const { textures, load } = this.scene;
    if (!textures.exists(key)) {
      load.image(key, path);
    } else {
      this.logger.debug(`[AssetLoader] Skipped duplicate texture: ${key}`);
    }
  }

  /** Loads a set of images from the given key/path map. */
  private loadImages(assets: Record<string, string>): void {
    for (const [key, path] of Object.entries(assets)) {
      this.loadImage(key, path);
    }
  }

  /** Starts the Phaser loader. */
  startLoading(): void {
    this.scene.load.start();
    this.logger.debug("[AssetLoader] Loader started");
  }
}