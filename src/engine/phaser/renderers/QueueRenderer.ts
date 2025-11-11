import type { IGameConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../../core/logging/ILogger";
import type { PipeQueue } from "../../../core/PipeQueue";


/** Handles rendering the pipe queue with sprite pooling for performance */
export class QueueRenderer {
  private readonly spritePool: Phaser.GameObjects.Image[] = [];
  private activeSprites: Phaser.GameObjects.Image[] = [];
  
  private readonly spacing = 16;
  private readonly startY = 80;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly logger: ILogger
  ) {}

  render(queue: PipeQueue): void {
    // Return unused sprites to pool
    this.activeSprites.forEach(sprite => {
      sprite.setVisible(false);
      this.spritePool.push(sprite);
    });
    this.activeSprites = [];

    const { cellSize } = this.config.grid;
    const startX = this.config.canvas.width / 2 - 150;

    queue.contents.forEach((pipe, i) => {
      const sprite = this.getOrCreateSprite();
      
      sprite
        .setPosition(startX + i * (cellSize + this.spacing), this.startY)
        .setTexture(pipe.assetKey)
        .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
        .setVisible(true);

      this.activeSprites.push(sprite);
    });

    this.logger.debug(`Rendered pipe queue (${queue.contents.length})`);
  }

  private getOrCreateSprite(): Phaser.GameObjects.Image {
    // Reuse from pool if available
    if (this.spritePool.length > 0) {
      return this.spritePool.pop()!;
    }

    // Create new sprite
    return this.scene.add
      .image(0, 0, "placeholder")
      .setOrigin(0.5)
      .setDepth(100);
  }

  /** Clean up all sprites (call on scene shutdown) */
  destroy(): void {
    this.activeSprites.forEach(s => s.destroy());
    this.spritePool.forEach(s => s.destroy());
    this.activeSprites = [];
    this.spritePool.length = 0;
  }
}