import type { ILogger } from "../../core/logging/ILogger";
import type { IPhaserScene } from "./IPhaserScene";

import tileBackground from "../../assets/tile-background.png";

import bombIdle from "../../assets/bomb/bomb-idle.png";
import bombExplosion1 from "../../assets/bomb/bomb-explosion-1.png";
import bombExplosion2 from "../../assets/bomb/bomb-explosion-2.png";

import gridCell from "../../assets/grid/grid-background.png";
import gridBlock from "../../assets/grid/grid-block.png";
import gridBorderSide from "../../assets/grid/grid-border-side.png";
import gridBorderCorner from "../../assets/grid/grid-border-corner.png";

import gridCursor from "../../assets/grid/grid-cursor.png";
import gridCursorAlt from "../../assets/grid/grid-cursor-alt.png";

import queueTile from "../../assets/queue/queue-tile.png";
import queueTileBorder from "../../assets/queue/queue-tile-border.png";
import queueSelected from "../../assets/queue/queue-selected.png";

import pipeStraight from "../../assets/pipes/pipe-straight.png";
import pipeCorner from "../../assets/pipes/pipe-corner.png";
import pipeCross from "../../assets/pipes/pipe-cross.png";
import pipeStart from "../../assets/pipes/pipe-start.png";


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
    "tile-background": tileBackground,
    "bomb-idle": bombIdle,
    "bomb-explosion-1": bombExplosion1,
    "bomb-explosion-2": bombExplosion2,
    "grid-cell": gridCell,
    "grid-block": gridBlock,
    "grid-border-side": gridBorderSide,
    "grid-border-corner": gridBorderCorner,
    "grid-cursor": gridCursor,
    "grid-cursor-alt": gridCursorAlt,
    "queue-tile": queueTile,
    "queue-tile-border": queueTileBorder,
    "queue-selected": queueSelected,
    "pipe-straight": pipeStraight,
    "pipe-corner": pipeCorner,
    "pipe-cross": pipeCross,
    "pipe-start": pipeStart,
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