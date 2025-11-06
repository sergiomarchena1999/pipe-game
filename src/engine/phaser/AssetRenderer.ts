import type { IGameConfig } from "../../config/GameConfig";
import type { ILogger } from "../../core/logging/ILogger";
import type { GridCell } from "../../core/GridCell";
import type { Pipe } from "../../core/Pipe";


/**
 * Handles all game rendering (grid, pipes, effects, etc.)
 */
export class AssetRenderer {
  private readonly pipeSprites = new Map<GridCell, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly logger: ILogger
  ) {}

  renderGridBackground(): void {
    const { cellSize, width, height } = this.config.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.scene.add
          .image(x * cellSize, y * cellSize, "grid-cell")
          .setOrigin(0)
          .setDepth(0);
      }
    }

    this.logger.debug(`Grid background rendered: ${width}x${height} cells`);
  }

  renderPipe(pipe: Pipe): void {
    const { cellSize } = this.config.grid;
    const x = pipe.position.x * cellSize + cellSize / 2;
    const y = pipe.position.y * cellSize + cellSize / 2;

    const sprite = this.scene.add
      .image(x, y, pipe.assetKey)
      .setOrigin(0.5)
      .setRotation(Phaser.Math.DegToRad(pipe.direction.angle))
      .setDepth(1);

    this.pipeSprites.set(pipe.position, sprite);
  }
}