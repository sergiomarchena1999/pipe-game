import type { WorldContainer } from "../WorldContainer";
import type { GridCell } from "../../../core/GridCell";
import type { Pipe } from "../../../core/Pipe";


/** Handles rendering individual pipes on the grid */
export class PipeRenderer {
  private readonly pipeSprites = new Map<GridCell, Phaser.GameObjects.Image>();

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