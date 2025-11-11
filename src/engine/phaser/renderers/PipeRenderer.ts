import type { CoordinateConverter } from "../../../utils/CoordinateConverter";
import type { GridCell } from "../../../core/GridCell";
import type { Pipe } from "../../../core/Pipe";


/** Handles rendering individual pipes on the grid */
export class PipeRenderer {
  private readonly pipeSprites = new Map<GridCell, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly converter: CoordinateConverter
  ) {}

  render(pipe: Pipe): void {
    const { worldX, worldY } = this.converter.gridToWorld(
      pipe.position.x,
      pipe.position.y
    );

    const sprite = this.scene.add
      .image(worldX, worldY, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
      .setDepth(1);

    this.pipeSprites.set(pipe.position, sprite);
  }

  /** Get sprite for a specific grid cell (useful for animations/removal) */
  getSprite(cell: GridCell): Phaser.GameObjects.Image | undefined {
    return this.pipeSprites.get(cell);
  }

  /** Remove sprite at specific position */
  remove(cell: GridCell): boolean {
    const sprite = this.pipeSprites.get(cell);
    if (sprite) {
      sprite.destroy();
      this.pipeSprites.delete(cell);
      return true;
    }
    return false;
  }

  /** Clear all pipe sprites */
  clear(): void {
    this.pipeSprites.forEach(sprite => sprite.destroy());
    this.pipeSprites.clear();
  }
}