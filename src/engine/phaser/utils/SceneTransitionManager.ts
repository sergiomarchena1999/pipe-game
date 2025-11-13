import Phaser from "phaser";
import { UIConfig } from "../../../config/UIConfig";

/**
 * Manages scene transitions with camera fade effects.
 * Provides a clean Promise-based API for scene changes.
 */
export class SceneTransitionManager {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Fade out the camera */
  fadeOut(duration: number = UIConfig.ANIMATION.FADE_OUT_DURATION): Promise<void> {
    return new Promise(resolve => {
      this.scene.cameras.main.fadeOut(duration, 0, 0, 0);
      this.scene.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => resolve()
      );
    });
  }

  /** Fade in the camera */
  fadeIn(duration: number = UIConfig.ANIMATION.FADE_IN_DURATION): Promise<void> {
    return new Promise(resolve => {
      this.scene.cameras.main.fadeIn(duration, 0, 0, 0);
      this.scene.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
        () => resolve()
      );
    });
  }

  /** Transition to another scene with fade out effect */
  async transitionTo(
    sceneKey: string,
    data?: any,
    fadeOutDuration: number = UIConfig.ANIMATION.FADE_OUT_DURATION
  ): Promise<void> {
    await this.fadeOut(fadeOutDuration);
    this.scene.scene.start(sceneKey, data);
  }

  /** Restart current scene with fade out effect */
  async restart(
    data?: any,
    fadeOutDuration: number = UIConfig.ANIMATION.FADE_OUT_QUICK
  ): Promise<void> {
    await this.fadeOut(fadeOutDuration);
    this.scene.scene.restart(data);
  }
}