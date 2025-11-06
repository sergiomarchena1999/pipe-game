import Phaser from "phaser";
import { PhaserAssetLoader } from "./PhaserAssetLoader";
import type { IGameConfig } from "../../config/GameConfig";
import type { GameState } from "../../core/GameState";

import gridCell from "../../../public/assets/grid-background.png";
import pipeStraight from "../../../public/assets/pipes/pipe-straight.png";
import pipeCorner from "../../../public/assets/pipes/pipe-corner.png";
import pipeCross from "../../../public/assets/pipes/pipe-cross.png";
import pipeStart from "../../../public/assets/pipes/pipe-start.png";


export class MainScene extends Phaser.Scene {
  private configData: IGameConfig;
  private state: GameState;

  constructor(config: IGameConfig, state: GameState) {
    super("MainScene");
    this.configData = config;
    this.state = state;
  }

  preload() {
    const loader = new PhaserAssetLoader(this);
    loader.loadImages({
        "grid-cell": gridCell,
        "pipe-straight": pipeStraight,
        "pipe-corner": pipeCorner,
        "pipe-cross": pipeCross,
        "pipe-start":pipeStart
    });

    loader.startLoading();
  }

  create() {
    const { grid } = this.configData;
    const gameGrid = this.state.grid;

    // Fondo del grid
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        this.add.image(x * grid.cellSize, y * grid.cellSize, "grid-cell").setOrigin(0);
      }
    }

    // Renderizar pipes desde el GameState
    gameGrid.forEachCell(cell => {
      if (cell.pipe) {
        this.add
          .image(
            cell.x * grid.cellSize,
            cell.y * grid.cellSize,
            cell.pipe.assetKey
          )
          .setOrigin(0)
          .setRotation(Phaser.Math.DegToRad(cell.pipe.rotation));
      }
    });
  }
}