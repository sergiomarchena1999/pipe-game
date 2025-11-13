import Phaser from "phaser";
import { AnimationPresets } from "../../../config/UIConfig";
import type { ILogger } from "../../../core/logging/ILogger";

/**
 * Centralized animation manager for creating and managing Phaser animations.
 * Prevents duplicate animation creation and provides a single source of truth.
 */
export class AnimationManager {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly logger: ILogger
  ) {}

  /**
   * Creates an animation only if it doesn't already exist.
   * Safe to call multiple times with the same key.
   */
  createIfNotExists(
    key: string,
    config: Omit<Phaser.Types.Animations.Animation, 'key'>
  ): void {
    if (this.scene.anims.exists(key)) {
      this.logger.debug(`Animation '${key}' already exists, skipping creation`);
      return;
    }

    this.scene.anims.create({ key, ...config });
    this.logger.debug(`Created animation: ${key}`);
  }

  /** Create all menu-related animations */
  createMenuAnimations(): void {
    this.createIfNotExists(
      AnimationPresets.MENU_TITLE.key,
      AnimationPresets.MENU_TITLE
    );
  }

  /** Create all game-related animations */
  createGameAnimations(): void {
    this.createIfNotExists(
      AnimationPresets.GRID_CURSOR.key,
      AnimationPresets.GRID_CURSOR
    );
  }

  /** Check if an animation exists */
  exists(key: string): boolean {
    return this.scene.anims.exists(key);
  }

  /** Remove an animation if it exists */
  remove(key: string): void {
    if (this.exists(key)) {
      this.scene.anims.remove(key);
      this.logger.debug(`Removed animation: ${key}`);
    }
  }
}