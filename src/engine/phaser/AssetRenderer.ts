import type { WorldContainer } from "./WorldContainer";
import type { IGameConfig } from "../../config/GameConfig";
import type { ILogger } from "../../core/logging/ILogger";
import type { PipeQueue } from "../../core/PipeQueue";
import type { Pipe } from "../../core/Pipe";
import type { Grid } from "../../core/Grid";

import { CursorRenderer } from "./renderers/CursorRenderer";
import { QueueRenderer } from "./renderers/QueueRenderer";
import { GridRenderer } from "./renderers/GridRenderer";
import { PipeRenderer } from "./renderers/PipeRenderer";
import { FlowRenderer } from "./renderers/FlowRenderer";


/**
 * Orchestrates all game rendering through specialized renderer components.
 * This is a facade that delegates to focused, single-responsibility renderers.
 */
export class AssetRenderer {
  // Specialized renderers
  private readonly gridRenderer: GridRenderer;
  private readonly cursorRenderer: CursorRenderer;
  private readonly pipeRenderer: PipeRenderer;
  private readonly queueRenderer: QueueRenderer;
  private readonly flowRenderer: FlowRenderer;

  constructor(
    scene: Phaser.Scene,
    config: IGameConfig,
    private readonly worldContainer: WorldContainer,
    logger: ILogger
  ) {
    // Initialize specialized renderers with world container
    this.gridRenderer = new GridRenderer(scene, config, worldContainer, logger);
    this.cursorRenderer = new CursorRenderer(scene, worldContainer, logger);
    this.pipeRenderer = new PipeRenderer(scene, worldContainer);
    this.queueRenderer = new QueueRenderer(scene, config, worldContainer, logger);
    this.flowRenderer = new FlowRenderer(scene, config, worldContainer);
  }

  renderGridBackground(grid: Grid): void {
    this.gridRenderer.renderBackground(grid);
  }

  renderPipe(pipe: Pipe): void {
    this.pipeRenderer.render(pipe);
  }

  renderQueue(queue: PipeQueue): void {
    this.queueRenderer.render(queue);
  }

  renderFlowPreview(): void {
    this.flowRenderer.renderPreview();
  }

  updateGridCursor(worldX: number, worldY: number): void {
    this.cursorRenderer.update(worldX, worldY);
  }

  hideGridCursor(): void {
    this.cursorRenderer.hide();
  }

  worldToGrid(worldX: number, worldY: number): { x: number; y: number } | null {
    return this.worldContainer.worldToGrid(worldX, worldY);
  }

  gridToWorld(x: number, y: number): { x: number; y: number } {
    return this.worldContainer.gridToLocal(x, y);
  }

  /** Clean up all resources */
  destroy(): void {
    this.queueRenderer.destroy();
    this.pipeRenderer.clear();
    this.flowRenderer.clear();
  }
}