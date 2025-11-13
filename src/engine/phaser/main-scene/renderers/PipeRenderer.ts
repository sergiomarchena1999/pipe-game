import Phaser from "phaser";
import { UIConfig } from "../../../../config/UIConfig";
import type { WorldContainer } from "../../WorldContainer";
import type { GridPosition } from "../../../../core/domain/grid/GridPosition";
import type { Pipe } from "../../../../core/domain/pipe/Pipe";


// ============================================================================
// PipeRenderer - Handles rendering individual pipes on the grid
// ============================================================================

export class PipeRenderer {
  private readonly pipeSprites = new Map<GridPosition, Phaser.GameObjects.Image>();
  private readonly bombSprites = new Map<GridPosition, Phaser.GameObjects.Image>();
  private readonly bombTimers = new Map<GridPosition, Phaser.Time.TimerEvent[]>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: WorldContainer
  ) {}

  render(pipe: Pipe): void {
    const pos = this.world.gridToLocal(pipe.position);
    const sprite = this.scene.add
      .image(pos.x, pos.y, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
      .setDepth(UIConfig.DEPTH.PIPE);

    this.world.add(sprite);
    this.pipeSprites.set(pipe.position, sprite);
  }

  /**
   * Starts bomb animation for a pipe at the given cell
   * @param posObj - Grid position where the bomb animation should play
   * @param durationMs - Total duration of the animation in milliseconds
   * @param onComplete - Callback when animation completes
   */
  startBombAnimation(posObj: GridPosition, durationMs: number, onComplete?: () => void): void {
    // Stop any existing animation at this position
    this.stopBombAnimation(posObj);

    const pos = this.world.gridToLocal(posObj);

    // Create bomb sprite
    const bombSprite = this.scene.add
      .image(pos.x, pos.y, "bomb-idle")
      .setOrigin(0.5)
      .setDepth(UIConfig.DEPTH.BOMB)
      .setAlpha(1);

    this.world.add(bombSprite);
    this.bombSprites.set(posObj, bombSprite);

    // Calculate timings
    const halfDuration = durationMs / 2;
    const explosionFrameTime = halfDuration / 4; // 4 frames alternating

    const timers: Phaser.Time.TimerEvent[] = [];

    // Phase 2: Start explosion sequence after half duration
    const explosionStartTimer = this.scene.time.delayedCall(halfDuration, () => {
      let frameIndex = 0;
      const frames = ["bomb-explosion-1", "bomb-explosion-2", "bomb-explosion-1", "bomb-explosion-2"];

      const frameTimer = this.scene.time.addEvent({
        delay: explosionFrameTime,
        repeat: frames.length - 1,
        callback: () => {
          if (bombSprite && bombSprite.active) {
            bombSprite.setTexture(frames[frameIndex]);
            frameIndex++;
          }
        }
      });

      timers.push(frameTimer);
    });

    timers.push(explosionStartTimer);

    // Cleanup after full duration
    const cleanupTimer = this.scene.time.delayedCall(durationMs, () => {
      this.cleanupBombAnimation(posObj);
      onComplete?.();
    });

    timers.push(cleanupTimer);
    this.bombTimers.set(posObj, timers);
  }

  /** Stops bomb animation at a specific position */
  stopBombAnimation(posObj: GridPosition): void {
    const timers = this.bombTimers.get(posObj);
    if (timers) {
      timers.forEach(timer => timer.remove());
      this.bombTimers.delete(posObj);
    }
    this.cleanupBombAnimation(posObj);
  }

  /** Cleans up bomb sprite at a position */
  private cleanupBombAnimation(posObj: GridPosition): void {
    const bombSprite = this.bombSprites.get(posObj);
    if (bombSprite) {
      bombSprite.destroy();
      this.bombSprites.delete(posObj);
    }

    const timers = this.bombTimers.get(posObj);
    if (timers) {
      timers.forEach(timer => timer.remove());
      this.bombTimers.delete(posObj);
    }
  }

  /** Get sprite for a specific grid position */
  getSprite(posObj: GridPosition): Phaser.GameObjects.Image | undefined {
    return this.pipeSprites.get(posObj);
  }

  /** Remove sprite at specific position */
  remove(posObj: GridPosition): boolean {
    // Stop any bomb animation first
    this.stopBombAnimation(posObj);

    const sprite = this.pipeSprites.get(posObj);
    if (sprite) {
      sprite.destroy();
      this.pipeSprites.delete(posObj);
      return true;
    }
    return false;
  }

  /** Clear all pipe sprites and bomb animations */
  clear(): void {
    // Stop all bomb animations
    this.bombTimers.forEach(timers => {
      timers.forEach(timer => timer.remove());
    });
    this.bombTimers.clear();

    // Destroy all bomb sprites
    this.bombSprites.forEach(sprite => sprite.destroy());
    this.bombSprites.clear();

    // Destroy all pipe sprites
    this.pipeSprites.forEach(sprite => sprite.destroy());
    this.pipeSprites.clear();
  }

  /** Complete cleanup with resource destruction */
  destroy(): void {
    this.clear();
  }
}