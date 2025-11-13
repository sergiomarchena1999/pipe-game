import type { WorldContainer } from "../../WorldContainer";
import type { IGameConfig } from "../../../../config/GameConfig";
import { FlowNetwork } from "../../../../core/domain/flow/FlowNetwork";
import { UIConfig } from "../../../../config/UIConfig";


/** Handles rendering of flow animations and preview */
export class FlowRenderer {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: IGameConfig,
    private readonly world: WorldContainer,
    private readonly flowNetwork: FlowNetwork
  ) {
    this.graphics = this.scene.add.graphics({
      lineStyle: {
        width: UIConfig.FLOW.ACTIVE_WIDTH,
        color: UIConfig.FLOW.ACTIVE_COLOR,
      },
    });

    this.graphics.setDepth(UIConfig.FLOW.DEPTH);
    this.world.add(this.graphics);
  }

  renderPreview(): void {
    this.graphics.clear();
    this.renderCompletedPorts();
    this.renderActiveFlow();
  }

  private renderCompletedPorts(): void {
    const { cellSize } = this.config.grid;
    const half = cellSize / 2;

    const visited = this.flowNetwork.getVisitedPortsSnapshot();

    for (const entry of visited) {
      const center = this.world.gridToLocal(entry.pipe.position);

      this.graphics.lineStyle(
        UIConfig.FLOW.COMPLETED_WIDTH,
        UIConfig.FLOW.COMPLETED_COLOR,
        1
      );

      for (const dir of entry.dirs) {
        const endX = center.x + dir.dx * half;
        const endY = center.y + dir.dy * half;
        this.graphics.lineBetween(center.x, center.y, endX, endY);
      }
    }
  }

  private renderActiveFlow(): void {
    const state = this.flowNetwork.getActiveState();
    if (!state) return;

    const { pipe, entryDir, exitDir, progress } = state;
    const { cellSize } = this.config.grid;
    const half = cellSize / 2;

    const center = this.world.gridToLocal(pipe.position);

    const entryPoint = entryDir
      ? {
          x: center.x + entryDir.dx * half,
          y: center.y + entryDir.dy * half,
        }
      : center;

    if (exitDir) {
      this.renderFlowWithExit(entryPoint, center, exitDir, half, progress);
    } else {
      this.renderFlowToCenter(entryPoint, center, progress);
    }
  }

  private renderFlowWithExit(
    entryPoint: { x: number; y: number },
    center: { x: number; y: number },
    exitDir: { dx: number; dy: number },
    half: number,
    progress: number
  ): void {
    this.graphics.lineStyle(
      UIConfig.FLOW.ACTIVE_WIDTH,
      UIConfig.FLOW.ACTIVE_COLOR,
      1
    );

    const split = UIConfig.FLOW.SPLIT_PERCENT;
    if (progress <= split) {
      // Entry edge -> center
      const t = progress / split;
      const ix = entryPoint.x + (center.x - entryPoint.x) * t;
      const iy = entryPoint.y + (center.y - entryPoint.y) * t;
      this.graphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
    } else {
      // Center -> exit edge
      const t = (progress - split) / (100 - split);
      const exitEdge = {
        x: center.x + exitDir.dx * half,
        y: center.y + exitDir.dy * half,
      };
      const ix = center.x + (exitEdge.x - center.x) * t;
      const iy = center.y + (exitEdge.y - center.y) * t;
      this.graphics.lineBetween(center.x, center.y, ix, iy);
    }
  }

  private renderFlowToCenter(
    entryPoint: { x: number; y: number },
    center: { x: number; y: number },
    progress: number
  ): void {
    const t = Math.min(1, progress / 100);

    this.graphics.lineStyle(
      UIConfig.FLOW.ACTIVE_WIDTH,
      UIConfig.FLOW.ACTIVE_COLOR,
      1
    );

    const ix = entryPoint.x + (center.x - entryPoint.x) * t;
    const iy = entryPoint.y + (center.y - entryPoint.y) * t;
    this.graphics.lineBetween(entryPoint.x, entryPoint.y, ix, iy);
  }

  clear(): void {
    this.graphics.clear();
  }
}