import type { WorldContainer } from "../../WorldContainer";
import type { IGameConfig } from "../../../../config/GameConfig";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { Grid } from "../../../../core/domain/grid/Grid";
import { GridPosition } from "../../../../core/domain/grid/GridPosition";
import { UIConfig } from "../../../../config/UIConfig";


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

    /** Draw a border segment using config depth */
    const drawBorder = (x: number, y: number, angle: number) => {
      const local = this.world.gridToLocalCorner({ x, y }); // raw grid coords

      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "grid-border-side")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(UIConfig.DEPTH.GRID_BORDER);

      this.world.add(sprite);
    };

    /** Draw a corner using config depth */
    const drawCorner = (x: number, y: number, angle: number) => {
      const local = this.world.gridToLocalCorner({ x, y });

      const sprite = this.scene.add
        .image(local.x + halfSize, local.y + halfSize, "grid-border-corner")
        .setOrigin(0.5)
        .setAngle(angle)
        .setDepth(UIConfig.DEPTH.GRID_BORDER);

      this.world.add(sprite);
    };

    // Top and bottom borders
    for (let x = -1; x <= width; x++) {
      drawBorder(x, -1, 0);       // Top
      drawBorder(x, height, 180); // Bottom
    }

    // Left and right borders
    for (let y = 0; y < height; y++) {
      drawBorder(-1, y, -90);     // Left
      drawBorder(width, y, 90);   // Right
    }

    // Corner pieces
    drawCorner(-1, -1, 0);           
    drawCorner(width, -1, 90);      
    drawCorner(-1, height, -90);   
    drawCorner(width, height, 180);

    // Draw grid cells with configured depth
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = GridPosition.create(x, y, width, height)!;
        const cell = grid.getCell(pos);
        const local = this.world.gridToLocalCorner(pos);

        const assetKey = cell.isBlocked ? "grid-block" : "grid-cell";

        const sprite = this.scene.add
          .image(local.x, local.y, assetKey)
          .setOrigin(0)
          .setDepth(UIConfig.DEPTH.GRID_CELL);

        this.world.add(sprite);
      }
    }

    this.logger.debug(`Grid rendered using config: ${width}x${height}, cellSize=${cellSize}`);
  }
}