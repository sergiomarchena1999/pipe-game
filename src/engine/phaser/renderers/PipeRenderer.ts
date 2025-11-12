import type { WorldContainer } from "../WorldContainer";
import type { GridCell } from "../../../core/GridCell";
import type { Pipe } from "../../../core/Pipe";


/** Handles rendering individual pipes on the grid */
export class PipeRenderer {
  private readonly pipeSprites = new Map<GridCell, Phaser.GameObjects.Image>();
  private readonly bombSprites = new Map<GridCell, Phaser.GameObjects.Image>();
  private readonly bombTimers = new Map<GridCell, Phaser.Time.TimerEvent[]>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: WorldContainer
  ) {}

  render(pipe: Pipe): void {
    const pos = this.world.gridToLocal(pipe.position.x, pipe.position.y);
    const sprite = this.scene.add
      .image(pos.x, pos.y, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
      .setDepth(5);

    this.world.add(sprite);
    this.pipeSprites.set(pipe.position, sprite);
  }

  /**
   * Starts bomb animation for a pipe at the given cell
   * @param cell - Grid cell where the bomb animation should play
   * @param durationMs - Total duration of the animation in milliseconds
   * @param onComplete - Callback when animation completes
   */
  startBombAnimation(cell: GridCell, durationMs: number, onComplete?: () => void): void {
    // Stop any existing animation at this cell
    this.stopBombAnimation(cell);

    const pos = this.world.gridToLocal(cell.x, cell.y);
    
    // Create bomb sprite
    const bombSprite = this.scene.add
      .image(pos.x, pos.y, "bomb-idle")
      .setOrigin(0.5)
      .setDepth(10) // Above pipes
      .setAlpha(1);

    // Phase 1: Show bomb-idle for half the duration (already set)
    this.world.add(bombSprite);
    this.bombSprites.set(cell, bombSprite);

    // Calculate timings
    const halfDuration = durationMs / 2;
    const explosionFrameTime = halfDuration / 4; // 4 frames for 2 images alternating twice

    const timers: Phaser.Time.TimerEvent[] = [];

    // Phase 2: Start explosion sequence after half duration
    const explosionStartTimer = this.scene.time.delayedCall(halfDuration, () => {
      // Alternate between explosion frames
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
      this.cleanupBombAnimation(cell);
      onComplete?.();
    });

    timers.push(cleanupTimer);

    this.bombTimers.set(cell, timers);
  }

  /** Stops bomb animation at a specific cell */
  stopBombAnimation(cell: GridCell): void {
    const timers = this.bombTimers.get(cell);
    if (timers) {
      timers.forEach(timer => timer.remove());
      this.bombTimers.delete(cell);
    }
    this.cleanupBombAnimation(cell);
  }

  /** Cleans up bomb sprite at a cell */
  private cleanupBombAnimation(cell: GridCell): void {
    const bombSprite = this.bombSprites.get(cell);
    if (bombSprite) {
      bombSprite.destroy();
      this.bombSprites.delete(cell);
    }

    // Clean up timers
    const timers = this.bombTimers.get(cell);
    if (timers) {
      timers.forEach(timer => timer.remove());
      this.bombTimers.delete(cell);
    }
  }

  /** Get sprite for a specific grid cell (useful for animations/removal) */
  getSprite(cell: GridCell): Phaser.GameObjects.Image | undefined {
    return this.pipeSprites.get(cell);
  }

  /** Remove sprite at specific position */
  remove(cell: GridCell): boolean {
    // Stop any bomb animation first
    this.stopBombAnimation(cell);

    const sprite = this.pipeSprites.get(cell);
    if (sprite) {
      sprite.destroy();
      this.pipeSprites.delete(cell);
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
}