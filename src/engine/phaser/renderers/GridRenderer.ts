import type { CoordinateConverter } from "../../../utils/CoordinateConverter";
import type { IGameConfig } from "../../../config/GameConfig";
import type { ILogger } from "../../../core/logging/ILogger";
import type { Grid } from "../../../core/Grid";


/** Handles rendering of the grid background and border */
export class GridRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly converter: CoordinateConverter,
    private readonly logger: ILogger
  ) {}

  renderBackground(grid: Grid): void {
    const { width, height, cellSize } = this.config.grid;
    const halfSize = cellSize /2;

    // Draw borders including a “padding” around the grid
    const drawBorder = (x: number, y: number, angle: number) => {
      const { worldX, worldY } = this.converter.gridToWorldCorner(x, y);
      this.scene.add
        .image(worldX + halfSize, worldY + halfSize, "grid-border-side")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(0); // behind cells
    };

    const drawCorner = (x: number, y: number, angle: number) => {
      const { worldX, worldY } = this.converter.gridToWorldCorner(x, y);
      this.scene.add
        .image(worldX + halfSize, worldY + halfSize, "grid-border-corner")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(0);
    };

    // Top and bottom borders
    for (let x = -1; x <= width; x++) {
      drawBorder(x, -1, 0);       // Top
      drawBorder(x, height, 180); // Bottom
    }

    // Left and right borders
    for (let y = 0; y < height; y++) {
      drawBorder(-1, y, -90);      // Left
      drawBorder(width, y, 90);    // Right
    }

    // Corners
    drawCorner(-1, -1, 0);           // Top-left
    drawCorner(width, -1, 90);       // Top-right
    drawCorner(-1, height, -90);     // Bottom-left
    drawCorner(width, height, 180);  // Bottom-right

    // Draw the grid cells on top
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid.getCell(x, y);
        const { worldX, worldY } = this.converter.gridToWorldCorner(x, y);

        const assetKey = cell.blocked ? "grid-block" : "grid-cell";
        this.scene.add
          .image(worldX, worldY, assetKey)
          .setOrigin(0)
          .setDepth(1); // above border
      }
    }

    this.logger.debug(`Grid background rendered: ${width}x${height} cells with outer border`);
  }
}