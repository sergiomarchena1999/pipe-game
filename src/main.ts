import "./style.css";
import { Game } from "./core/Game";
import { Logger } from "./utils/Logger";

window.addEventListener("DOMContentLoaded", () => {
  // Setup logging system
  const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
  const logger = new Logger(logLevel);

  // Find the app container (the div in index.html)
  const appContainer = document.querySelector<HTMLDivElement>("#app");
  if (!appContainer) {
    console.error("No #app container found in index.html");
    return;
  }

  // Optionally, create and append a canvas element
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  canvas.id = "game-canvas";
  appContainer.appendChild(canvas);

  // Create and start the game
  const game = new Game(logger);
  game.start();

  // Optional debug bindings
  (window as any).game = game;
  logger.info("Game initialized and started");
});