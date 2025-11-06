export interface IPhaserScene {
  textures: {
    exists(key: string): boolean;
  };
  load: {
    image(key: string, path: string): void;
    start(): void;
    on: Function;
    once: Function;
  };
  events: {
    once(event: string, callback: Function): void;
    emit(event: string, ...args: any[]): void;
  };
}