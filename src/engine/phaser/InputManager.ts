import type { GameState } from "../../core/GameState";
import type { ILogger } from "../../core/logging/ILogger";
import { WaterFlowManager } from "../../core/WaterFlow";
import { AssetRenderer } from "./AssetRenderer";

/**
 * Centralized input manager for the scene.
 * Handles grid clicks and can be extended for other input types.
 */
export class InputManager {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly renderer: AssetRenderer,
    private readonly logger: ILogger
  ) {}

  initialize(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    try {
      // Prefer world coordinates which account for the camera / transforms.
      // Phaser's pointer often has worldX/worldY available (depending on version)
      const worldX = (pointer as any).worldX ?? pointer.x;
      const worldY = (pointer as any).worldY ?? pointer.y;

      const gridPos = this.renderer.worldToGrid(worldX, worldY);
      if (!gridPos) {
        this.logger.debug(`Pointer outside grid: world=(${worldX}, ${worldY})`);
        return;
      }

      const { x: gridX, y: gridY } = gridPos;

      const placed = this.state.placeNextPipe(gridX, gridY);
      if (!placed) {
        this.logger.debug(`Placement rejected at (${gridX}, ${gridY})`);
        return;
      }

      this.renderer.renderPipe(placed);
      this.renderer.renderFlowPreview(WaterFlowManager.pipes);
    } catch (err) {
      this.logger.error("Error during grid click", err);
    }
  }
}