
export interface IGameConfig {
  grid: {
    width: number;
    height: number;
    cellSize: number;
  };
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
}

export const GameConfig: IGameConfig = {
  grid: {
    width: 8,
    height: 8,
    cellSize: 32,
  },
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: "#00a187",
  },
};