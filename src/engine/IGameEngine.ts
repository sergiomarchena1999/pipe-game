import type { IGameConfig } from "../config/GameConfig";
import type { GameState } from "../core/GameState";
import type { Logger } from "../core/logging/Logger";


export interface IGameEngine {
  initialize(containerId: string, config: IGameConfig, state: GameState, logger: Logger): Promise<void>;
  destroy(): void;
}