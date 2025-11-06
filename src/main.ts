import "./style.css";
import { Game } from "./core/Game";
import { Logger } from "./utils/Logger";


window.addEventListener("DOMContentLoaded", () => {
  // Setup logging system
  const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
  const logger = new Logger(logLevel);

  // Create and start the game
  const game = new Game(logger);
  game.start();

  // Optional debug bindings
  (window as any).game = game;
  logger.info("Game initialized and started");
});