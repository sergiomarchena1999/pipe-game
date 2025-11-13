import type { GridPosition } from "../../../core/domain/grid/GridPosition";
import type { GameState } from "../../../core/GameState";
import type { ILogger } from "../../../core/logging/ILogger";
import { AssetRenderer } from "./AssetRenderer";

/**
 * Centralized input manager for the scene.
 * Handles grid clicks and can be extended for other input types.
 */
export class InputManager {
  private enabled = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly renderer: AssetRenderer,
    private readonly logger: ILogger
  ) {}

  initialize(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.enabled) this.handlePointerDown(pointer);
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.enabled) this.handlePointerMove(pointer);
    });

    this.scene.input.on("pointerout", () => {
      if (this.enabled) this.renderer.hideGridCursor();
    });
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.renderer.hideGridCursor(); // optional: hide cursor when disabled
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    try {
      const worldX = (pointer as any).worldX ?? pointer.x;
      const worldY = (pointer as any).worldY ?? pointer.y;

      const gridPos: GridPosition | null = this.renderer.worldToGrid(worldX, worldY);
      if (!gridPos) {
        this.logger.debug(`Pointer outside grid: world=(${worldX}, ${worldY})`);
        return;
      }

      const result = this.state.placeNextPipe(gridPos);
      if (!result.success) {
        this.logger.debug(`Failed to place pipe at ${gridPos}: ${result.error}`);
        return;
      }

      const pipe = result.value;
      this.renderer.addPipe(pipe);
      this.renderer.renderWaterFlow();
    } catch (err) {
      this.logger.error("Error during grid click", err);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Get world coordinates (accounting for camera transforms)
    const worldX = (pointer as any).worldX ?? pointer.x;
    const worldY = (pointer as any).worldY ?? pointer.y;

    // Update cursor position
    this.renderer.updateGridCursor(worldX, worldY);
  }
}