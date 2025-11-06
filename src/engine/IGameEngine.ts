import type { IGameConfig } from "../config/GameConfig";
import type { GameState } from "../core/GameState";


export interface IGameEngine {
  initialize(containerId: string, config: IGameConfig, state: GameState): Promise<void>;
  start(): void;
  destroy(): void;

  addEntity(entity: any): void;
  removeEntity(entity: any): void;
}