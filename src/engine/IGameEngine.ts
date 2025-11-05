export interface IGameEngine {
  initialize(containerId: string): Promise<void>;
  start(): void;
  destroy(): void;

  /** Método genérico para registrar assets antes del start() */
  preloadAssets(): Promise<void>;

  addEntity(entity: any): void;
  removeEntity(entity: any): void;
}