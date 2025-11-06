import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";
import type { ILogger } from "../../core/logging/ILogger";
import { AssetRenderer } from "./AssetRenderer";

/**
 * Centralized input manager for the scene.
 * Handles grid clicks and can be extended for other input types.
 */
export class InputManager {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
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
    const { cellSize, width, height } = this.config.grid;

    const gridX = Math.floor(pointer.x / cellSize);
    const gridY = Math.floor(pointer.y / cellSize);

    if (gridX < 0 || gridY < 0 || gridX >= width || gridY >= height) {
      this.logger.debug(`Pointer outside grid: (${pointer.x}, ${pointer.y})`);
      return;
    }

    try {
      const placed = this.state.placeNextPipe(gridX, gridY);
      if (!placed) {
        this.logger.debug(`Placement rejected at (${gridX}, ${gridY})`);
        return;
      }

      this.renderer.renderPipe(placed);
    } catch (err) {
      this.logger.error("Error during grid click", err);
    }
  }
}