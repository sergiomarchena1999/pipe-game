import type { GridPosition } from "../../../core/domain/grid/GridPosition";
import type { GameState } from "../../../core/GameState";
import type { ILogger } from "../../../core/logging/ILogger";
import { AssetRenderer } from "./AssetRenderer";


/** Extended Phaser pointer type with world coordinates */
interface WorldPointer extends Phaser.Input.Pointer {
  readonly worldX: number;
  readonly worldY: number;
}

/**
 * Centralized input manager for the scene.
 * Handles grid clicks and pointer movement for cursor updates.
 */
export class InputManager {
  private enabled = true;
  private pointerDownHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerMoveHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerOutHandler?: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly renderer: AssetRenderer,
    private readonly logger: ILogger
  ) {}

  initialize(): void {
    // Store handlers for cleanup
    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.enabled) this.handlePointerDown(pointer);
    };

    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.enabled) this.handlePointerMove(pointer);
    };

    this.pointerOutHandler = () => {
      if (this.enabled) this.renderer.hideGridCursor();
    };

    // Register event listeners
    this.scene.input.on("pointerdown", this.pointerDownHandler);
    this.scene.input.on("pointermove", this.pointerMoveHandler);
    this.scene.input.on("pointerout", this.pointerOutHandler);

    this.logger.debug("InputManager initialized");
  }

  enable(): void {
    this.enabled = true;
    this.logger.debug("Input enabled");
  }

  disable(): void {
    this.enabled = false;
    this.renderer.hideGridCursor();
    this.logger.debug("Input disabled");
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    try {
      const { worldX, worldY } = this.getWorldCoordinates(pointer);
      const gridPos = this.renderer.worldToGrid(worldX, worldY);

      if (!gridPos) {
        this.logger.debug(`Pointer outside grid: world=(${worldX}, ${worldY})`);
        return;
      }

      this.placePipeAtPosition(gridPos);
    } catch (err) {
      this.logger.error("Error during grid click", err);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const { worldX, worldY } = this.getWorldCoordinates(pointer);
    this.renderer.updateGridCursor(worldX, worldY);
  }

  private getWorldCoordinates(pointer: Phaser.Input.Pointer): { worldX: number; worldY: number } {
    const worldPointer = pointer as WorldPointer;
    return {
      worldX: worldPointer.worldX ?? pointer.x,
      worldY: worldPointer.worldY ?? pointer.y
    };
  }

  private placePipeAtPosition(gridPos: GridPosition): void {
    const result = this.state.placeNextPipe(gridPos);

    if (!result.success) {
      this.logger.debug(`Failed to place pipe at ${gridPos}: ${result.error}`);
      return;
    }

    const pipe = result.value;
    this.renderer.addPipe(pipe);
    this.renderer.renderWaterFlow();

    this.logger.debug(`Pipe placed at ${gridPos}`);
  }

  /** Clean up event listeners */
  destroy(): void {
    if (this.pointerDownHandler) {
      this.scene.input.off("pointerdown", this.pointerDownHandler);
    }
    if (this.pointerMoveHandler) {
      this.scene.input.off("pointermove", this.pointerMoveHandler);
    }
    if (this.pointerOutHandler) {
      this.scene.input.off("pointerout", this.pointerOutHandler);
    }

    this.logger.debug("InputManager destroyed");
  }
}