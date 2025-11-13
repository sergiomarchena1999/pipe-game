import Phaser from "phaser";
import { UIConfig } from "../../../../config/UIConfig";
import { ButtonFactory } from "../../utils/ButtonFactory";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { GameState } from "../../../../core/GameState";

/**
 * Handles all UI elements in the MainScene: score, panels, and buttons.
 * Decouples UI creation and animations from MainScene logic.
 */
export class UIRenderer {
  private scoreText?: Phaser.GameObjects.Text;
  private gameOverPanel?: Phaser.GameObjects.Image;
  private overlay?: Phaser.GameObjects.Rectangle;
  private backButton?: Phaser.GameObjects.Text;
  private uiFixedContainer: Phaser.GameObjects.Container;
  private uiDynamicContainer: Phaser.GameObjects.Container;
  private buttonFactory: ButtonFactory;
  private currentScale = 1;
  private isActive = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly logger: ILogger
  ) {
    this.uiFixedContainer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.uiDynamicContainer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.buttonFactory = new ButtonFactory(scene);
    this.scene.scale.on("resize", this.handleResize, this);
  }

  /** Creates the persistent UI (score, back button, etc.) */
  createBaseUI(): void {
    this.createScoreDisplay();
    this.createBackButton();
    this.repositionUI();
    this.logger.debug("Base UI created");
  }

  /** Creates and initializes the score display text */
  private createScoreDisplay(): void {
    const targetScore = this.state.scoreController.targetScore;

    this.scoreText = this.createText(
      UIConfig.LAYOUT.PADDING,
      UIConfig.LAYOUT.PADDING,
      `Pipes: 0/${targetScore} | Score: 0`,
      {
        fontSize: UIConfig.TEXT.SCORE_SIZE,
        color: UIConfig.TEXT.COLOR_LIGHT,
        padding: { x: 12, y: 8 }
      }
    ).setOrigin(0, 0);

    this.uiFixedContainer.add(this.scoreText);
  }

  /** Updates score display */
  updateScoreDisplay(score: number, pipesFlowed: number): void {
    if (!this.scoreText) return;

    const targetScore = this.state.scoreController.targetScore;
    const progress = this.state.scoreController.progressPercent.toFixed(0);

    this.scoreText.setText(
      `Pipes: ${pipesFlowed}/${targetScore} (${progress}%) | Score: ${score}`
    );
  }

  /** Displays the game over panel */
  showGameOverPanel(
    panelKey: "winner-panel" | "loser-panel",
    score: number,
    pipesFlowed: number,
    onPlayAgain: () => void,
    onReturnToMenu: () => void
  ): void {
    const { width, height } = this.scene.scale;

    // Create overlay
    this.createOverlay(width, height);

    // Create dynamic elements in scaled container
    this.createPanel(panelKey, 0, UIConfig.LAYOUT.GAME_OVER_PANEL_OFFSET_Y);
    const statsText = this.createStatsText(0, UIConfig.LAYOUT.STATS_OFFSET_Y, score, pipesFlowed);
    const buttons = this.createGameOverButtons(0, UIConfig.LAYOUT.BUTTON_ROW_OFFSET_Y, onPlayAgain, onReturnToMenu);

    this.uiDynamicContainer.add([this.gameOverPanel!, statsText, ...buttons]);
    this.animateGameOverPanel(statsText, buttons);

    this.logger.info(`GameOverPanel displayed: ${panelKey}`);
  }

  private createOverlay(width: number, height: number): void {
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(UIConfig.DEPTH.OVERLAY)
      .setScrollFactor(0)
      .setInteractive();

    this.uiFixedContainer.add(this.overlay);
  }

  private createPanel(panelKey: string, x: number, y: number): void {
    this.gameOverPanel = this.scene.add.image(x, y, panelKey)
      .setDepth(UIConfig.DEPTH.PANEL)
      .setScrollFactor(0)
      .setScale(0);
  }

  private createStatsText(x: number, y: number, score: number, pipesFlowed: number): Phaser.GameObjects.Text {
    return this.createText(
      x,
      y,
      `Final Score: ${score}\nPipes Connected: ${pipesFlowed}`,
      {
        fontSize: UIConfig.TEXT.STATS_SIZE,
        color: UIConfig.TEXT.COLOR_LIGHT,
        align: "center"
      }
    ).setOrigin(0.5).setAlpha(0);
  }

  private createGameOverButtons(
    centerX: number,
    buttonY: number,
    onPlayAgain: () => void,
    onReturnToMenu: () => void
  ): Phaser.GameObjects.Container[] {
    const buttonSpacing = UIConfig.LAYOUT.BUTTON_SPACING;

    const playAgainButton = this.buttonFactory.createPanelButton(
      centerX - buttonSpacing / 2,
      buttonY,
      "Play Again",
      onPlayAgain
    ).setAlpha(0);

    const menuButton = this.buttonFactory.createPanelButton(
      centerX + buttonSpacing / 2,
      buttonY,
      "Main Menu",
      onReturnToMenu
    ).setAlpha(0);

    return [playAgainButton, menuButton];
  }

  private animateGameOverPanel(
    statsText: Phaser.GameObjects.Text,
    buttons: Phaser.GameObjects.Container[]
  ): void {
    this.scene.tweens.add({
      targets: this.gameOverPanel,
      scale: 1,
      duration: UIConfig.ANIMATION.PANEL_SCALE_DURATION,
      ease: "Back.easeOut"
    });

    this.scene.tweens.add({
      targets: [statsText, ...buttons],
      alpha: 1,
      duration: 300,
      delay: UIConfig.ANIMATION.STATS_DELAY,
      ease: "Power2"
    });
  }

  private createText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      fontFamily: UIConfig.TEXT.FONT_FAMILY,
      ...style
    }).setDepth(UIConfig.DEPTH.UI_BASE);
  }

  private createBackButton(): void {
    this.backButton = this.createText(
      0,
      0,
      "Back to Menu",
      {
        fontSize: UIConfig.TEXT.SCORE_SIZE,
        color: UIConfig.TEXT.COLOR_LIGHT,
        padding: { x: 12, y: 6 }
      }
    )
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.backButton.on("pointerdown", () => {
      this.scene.events.emit("ui:backToMenu");
    });

    this.uiFixedContainer.add(this.backButton);
  }

  private handleResize(): void {
    if (!this.isActive) return;
    this.repositionUI();
  }

  /** Adjust UI positions and scale based on screen size */
  private repositionUI(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 🔹 Scale only dynamic container (game over panel, stats, etc.)
    const scaleX = width / UIConfig.RESPONSIVE.DESIGN_WIDTH;
    const scaleY = height / UIConfig.RESPONSIVE.DESIGN_HEIGHT;
    const targetScale = Phaser.Math.Clamp(
      Math.min(scaleX, scaleY),
      UIConfig.RESPONSIVE.MIN_SCALE,
      UIConfig.RESPONSIVE.MAX_SCALE
    );

    if (targetScale !== this.currentScale) {
      this.currentScale = targetScale;
      this.scene.tweens.add({
        targets: this.uiDynamicContainer,
        scale: targetScale,
        duration: UIConfig.RESPONSIVE.SCALE_TWEEN_DURATION,
        ease: "Power2"
      });
    }

    this.uiDynamicContainer.setPosition(centerX, centerY);

    if (this.scoreText) {
      this.scoreText.setPosition(UIConfig.LAYOUT.PADDING, UIConfig.LAYOUT.PADDING);
    }

    if (this.backButton) {
      this.backButton.setPosition(width - UIConfig.LAYOUT.PADDING, UIConfig.LAYOUT.PADDING);
    }

    if (this.overlay && this.isAlive(this.overlay)) {
      this.overlay.setSize(width, height);
    }
  }

  private isAlive(obj?: Phaser.GameObjects.GameObject): boolean {
    return !!(obj && obj.scene);
  }

  destroy(): void {
    this.isActive = false;
    this.scene.scale.off("resize", this.handleResize, this);
    this.uiFixedContainer.destroy(true);
    this.uiDynamicContainer.destroy(true);
    this.logger.debug("UIRenderer destroyed");
  }
}