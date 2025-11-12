import type { WorldContainer } from "../../WorldContainer";
import type { IGameConfig } from "../../../../config/GameConfig";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { Grid } from "../../../../core/domain/grid/Grid";
import { GridPosition } from "../../../../core/domain/grid/GridPosition";


/** Handles rendering of the grid background and border */
export class GridRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly world: WorldContainer,
    private readonly logger: ILogger
  ) {}

  renderBackground(grid: Grid): void {
    const { width, height, cellSize } = this.config.grid;
    const halfSize = cellSize / 2;

    /** Helper to draw a border sprite at raw x,y coordinates */
    const drawBorder = (x: number, y: number, angle: number) => {
      const local = this.world.gridToLocalCorner({x, y}); // Use raw numbers
      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "grid-border-side")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(1);
      this.world.add(sprite);
    };

    /** Helper to draw a corner sprite at raw x,y coordinates */
    const drawCorner = (x: number, y: number, angle: number) => {
      const local = this.world.gridToLocalCorner({x, y});
      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "grid-border-corner")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(1);
      this.world.add(sprite);
    };

    // Top and bottom borders (use raw numbers)
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

    // Draw the grid cells (these ARE valid GridPositions)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = GridPosition.create(x, y, width, height)!; // Always valid in bounds
        const cell = grid.getCell(pos);
        const local = this.world.gridToLocalCorner(pos);

        const assetKey = cell.isBlocked ? "grid-block" : "grid-cell";
        const sprite = this.scene.add
          .image(local.x, local.y, assetKey)
          .setOrigin(0)
          .setDepth(2);

        this.world.add(sprite);
      }
    }

    this.logger.debug(`Grid background rendered: ${width}x${height} cells with outer border`);
  }
}