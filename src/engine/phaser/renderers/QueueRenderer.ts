import type { WorldContainer } from "../WorldContainer";
import type { IGameConfig } from "../../../config/GameConfig";
import type { PipeQueue } from "../../../core/PipeQueue";
import type { ILogger } from "../../../core/logging/ILogger";


/** Handles rendering the pipe queue with sprite pooling for performance */
export class QueueRenderer {
  private readonly spritePool: Phaser.GameObjects.Image[] = [];
  private backgroundSprites: Phaser.GameObjects.Image[] = [];
  private activeSprites: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly world: WorldContainer,
    private readonly logger: ILogger
  ) {
    const queuePos = this.world.getQueuePosition();
    const queueCenterX = queuePos.x;
    const cellSize = config.grid.cellSize;
    const totalHeight = config.queueSize * cellSize - cellSize;

    for (let i = 0; i < config.queueSize; i++) {
      const bgY = queuePos.y - totalHeight + (i * cellSize);
      const sprite = i == config.queueSize - 1 
        ? "queue-selected"
        : i == 0
          ? "queue-tile-border"
          : "queue-tile";
      const background = this.scene.add
        .image(queueCenterX, bgY, sprite)
        .setOrigin(0.5, 0)
        .setDepth(99);
      
      this.world.add(background);
      this.backgroundSprites.push(background);
    }
  }

  render(queue: PipeQueue): void {
    // Recycle old sprites
    this.activeSprites.forEach(sprite => {
      sprite.setVisible(false);
      this.spritePool.push(sprite);
    });
    this.activeSprites = [];

    const cellSize = this.config.grid.cellSize;
    const halfSize = cellSize / 2;

    // Get queue position from world container
    const queuePos = this.world.getQueuePosition();
    const startX = queuePos.x;

    // Calculate starting Y position (bottom-aligned with grid)
    const totalHeight = queue.contents.length * cellSize;
    let startY = totalHeight - cellSize;

    // Render pipes from bottom to top
    queue.contents.forEach(pipe => {
      const sprite = this.getOrCreateSprite();

      sprite
        .setPosition(startX, startY + halfSize)
        .setTexture(pipe.assetKey)
        .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
        .setVisible(true);

      this.activeSprites.push(sprite);
      startY -= cellSize;
    });

    this.logger.debug(`Rendered queue (${queue.contents.length}) at x=${startX}`);
  }

  private getOrCreateSprite(): Phaser.GameObjects.Image {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop()!;
      // Ensure sprite is in the world container
      if (!sprite.parentContainer) {
        this.world.add(sprite);
      }
      return sprite;
    }

    const sprite = this.scene.add
      .image(0, 0, "placeholder")
      .setOrigin(0.5)
      .setDepth(100);
    
    this.world.add(sprite);
    return sprite;
  }

  destroy(): void {
    this.activeSprites.forEach(s => s.destroy());
    this.spritePool.forEach(s => s.destroy());
    this.activeSprites = [];
    this.spritePool.length = 0;
  }
}