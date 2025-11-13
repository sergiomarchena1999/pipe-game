import type { WorldContainer } from "../../WorldContainer";
import type { IGameConfig } from "../../../../config/GameConfig";
import type { PipeQueue } from "../../../../core/domain/pipe/PipeQueue";
import type { ILogger } from "../../../../core/logging/ILogger";


/** Handles rendering the pipe queue with sprite pooling for performance */
export class QueueRenderer {
  private readonly spritePool: Phaser.GameObjects.Image[] = [];
  private activeSprites: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly world: WorldContainer,
    private readonly logger: ILogger
  ) {
    this.renderQueueBorder();
  }

  private renderQueueBorder(): void {
    const { cellSize } = this.config.grid;
    const maxSize = this.config.queue.maxSize;
    const halfSize = cellSize / 2;

    // Queue dimensions: 1 cell wide, maxSize cells tall
    const queueWidth = 1;
    const queueHeight = maxSize;

    /** Helper to draw a border sprite at raw x,y coordinates */
    const drawBorder = (x: number, y: number, angle: number) => {
      const local = this.world.queueToLocalCorner({x, y});
      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "queue-side")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(98);
      this.world.add(sprite);
    };

    /** Helper to draw a corner sprite at raw x,y coordinates */
    const drawCorner = (x: number, y: number, angle: number) => {
      const local = this.world.queueToLocalCorner({x, y});
      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "queue-corner")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(99);
      this.world.add(sprite);
    };

    drawBorder(0, -1, 0);              // Top
    drawBorder(0, queueHeight, 180);   // Bottom

    // Left and right borders
    for (let y = 0; y < queueHeight; y++) {
      drawBorder(-1, y, -90);            // Left
      drawBorder(queueWidth, y, 90);     // Right
    }

    // Corners
    drawCorner(-1, -1, 0);                    // Top-left
    drawCorner(queueWidth, -1, 90);           // Top-right
    drawCorner(-1, queueHeight, -90);         // Bottom-left
    drawCorner(queueWidth, queueHeight, 180); // Bottom-right

    const local = this.world.queueToLocalCorner({x: 0, y: 0});
    const sprite = this.scene.add
      .image(local.x, local.y, "queue-selected")
      .setOrigin(0)
      .setDepth(97);
    this.world.add(sprite);

    this.logger.debug(`Queue border rendered: ${queueWidth}x${queueHeight} cells`);
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

    // Render pipes from bottom to top (index 0 at bottom)
    queue.contents.forEach((pipe, index) => {
      const sprite = this.getOrCreateSprite();
      const local = this.world.queueToLocalCorner({x: 0, y: index});

      sprite
        .setPosition(local.x + halfSize, local.y + halfSize)
        .setTexture(pipe.assetKey)
        .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
        .setVisible(true);

      this.activeSprites.push(sprite);
    });

    this.logger.debug(`Rendered queue (${queue.contents.length} pipes)`);
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