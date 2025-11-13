import { AnimationPresets, UIConfig } from "../../../../config/UIConfig";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { WorldContainer } from "../../WorldContainer";


// ============================================================================
// CursorRenderer - Handles the animated grid cursor
// ============================================================================

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
      .setDepth(UIConfig.DEPTH.CURSOR)
      .setVisible(false);

    this.world.add(this.gridCursor);
    this.gridCursor.play(AnimationPresets.GRID_CURSOR.key);
  }

  private createAnimation(): void {
    if (this.scene.anims.exists(AnimationPresets.GRID_CURSOR.key)) {
      return;
    }

    this.scene.anims.create(AnimationPresets.GRID_CURSOR);
    this.logger.debug("Created grid cursor animation");
  }

  update(worldX: number, worldY: number): void {
    const gridPos = this.world.worldToGrid(worldX, worldY);
    if (!gridPos) {
      this.gridCursor.setVisible(false);
      return;
    }

    const pos = this.world.gridToLocalCorner(gridPos);
    this.gridCursor.setPosition(pos.x, pos.y).setVisible(true);
  }

  hide(): void {
    this.gridCursor.setVisible(false);
  }

  destroy(): void {
    this.gridCursor.destroy();
    this.logger.debug("CursorRenderer destroyed");
  }
}