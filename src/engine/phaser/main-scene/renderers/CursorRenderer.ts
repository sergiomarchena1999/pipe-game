import type { WorldContainer } from "../../WorldContainer";
import type { ILogger } from "../../../../core/logging/ILogger";


/** Handles the animated grid cursor */
export class CursorRenderer {
  private gridCursor: Phaser.GameObjects.Sprite;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: WorldContainer,
    private readonly logger: ILogger
  ) {
    this.createAnimation();
    
    this.gridCursor = this.scene.add
      .sprite(0, 0, "grid-cursor")
      .setOrigin(0)
      .setDepth(10)
      .setVisible(false);
    
    this.world.add(this.gridCursor);
    this.gridCursor.play("grid-cursor-anim");
  }

  private createAnimation(): void {
    if (this.scene.anims.exists("grid-cursor-anim")) {
      return;
    }

    this.scene.anims.create({
      key: "grid-cursor-anim",
      frames: [
        { key: "grid-cursor" },
        { key: "grid-cursor-alt" }
      ],
      frameRate: 2,
      repeat: -1
    });

    this.logger.debug("Created grid cursor animation");
  }

  update(worldX: number, worldY: number): void {
    const gridPos = this.world.worldToGrid(worldX, worldY);
    if (!gridPos) {
      this.gridCursor.setVisible(false);
      return;
    }

    const pos = this.world.gridToLocalCorner(gridPos.x, gridPos.y);
    this.gridCursor.setPosition(pos.x, pos.y).setVisible(true);
  }

  hide(): void {
    this.gridCursor.setVisible(false);
  }
}