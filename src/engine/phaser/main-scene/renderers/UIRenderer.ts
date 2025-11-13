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
  private uiContainer: Phaser.GameObjects.Container;
  private buttonFactory: ButtonFactory;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly logger: ILogger
  ) {
    this.uiContainer = this.scene.add.container(0, 0).setScrollFactor(0);
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
        color: UIConfig.TEXT.COLOR_WHITE,
        padding: { x: 12, y: 8 }
      }
    ).setOrigin(0, 0);

    this.uiContainer.add(this.scoreText);
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
    const centerX = width / 2;
    const centerY = height / 2;

    // Create overlay
    this.createOverlay(width, height);

    // Create panel
    this.createPanel(panelKey, centerX, centerY + UIConfig.LAYOUT.GAME_OVER_PANEL_OFFSET_Y);

    // Create stats text
    const statsText = this.createStatsText(centerX, centerY + UIConfig.LAYOUT.STATS_OFFSET_Y, score, pipesFlowed);

    // Create buttons
    const buttons = this.createGameOverButtons(centerX, centerY + UIConfig.LAYOUT.BUTTON_ROW_OFFSET_Y, onPlayAgain, onReturnToMenu);

    // Add to UI container
    this.uiContainer.add([this.gameOverPanel!, statsText, ...buttons]);

    // Animate everything
    this.animateGameOverPanel(statsText, buttons);

    this.logger.info(`GameOverPanel displayed: ${panelKey}`);
  }

  private createOverlay(width: number, height: number): void {
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(UIConfig.DEPTH.OVERLAY)
      .setScrollFactor(0)
      .setInteractive();

    this.uiContainer.add(this.overlay);
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
        color: UIConfig.TEXT.COLOR_WHITE,
        stroke: UIConfig.TEXT.STROKE_COLOR,
        strokeThickness: UIConfig.TEXT.STROKE_THICKNESS,
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
    // Panel scale in
    this.scene.tweens.add({
      targets: this.gameOverPanel,
      scale: 1,
      duration: UIConfig.ANIMATION.PANEL_SCALE_DURATION,
      ease: "Back.easeOut"
    });

    // Fade in stats and buttons
    this.scene.tweens.add({
      targets: [statsText, ...buttons],
      alpha: 1,
      duration: 300,
      delay: UIConfig.ANIMATION.STATS_DELAY,
      ease: "Power2"
    });
  }

  /** Generic text creation helper with custom font support */
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

  /** Creates top-right back button */
  private createBackButton(): void {
    this.backButton = this.createText(
      0,
      0,
      "Back to Menu",
      {
        fontSize: UIConfig.TEXT.SCORE_SIZE,
        color: UIConfig.TEXT.COLOR_WHITE,
        padding: { x: 12, y: 6 }
      }
    )
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.backButton.on("pointerdown", () => {
      this.scene.events.emit("ui:backToMenu");
    });

    this.uiContainer.add(this.backButton);
  }

  /** Handle resize */
  private handleResize(): void {
    this.repositionUI();
  }

  /** Adjust UI positions based on screen size */
  private repositionUI(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position back button
    if (this.backButton) {
      this.backButton.setPosition(width - UIConfig.LAYOUT.PADDING, UIConfig.LAYOUT.PADDING);
    }

    // Reposition game over elements if visible
    if (this.overlay) {
      this.overlay.setSize(width, height);
    }

    if (this.gameOverPanel) {
      this.gameOverPanel.setPosition(centerX, centerY + UIConfig.LAYOUT.GAME_OVER_PANEL_OFFSET_Y);
    }

    // Find and reposition stats text
    const statsText = this.findStatsText();
    if (statsText) {
      statsText.setPosition(centerX, centerY + UIConfig.LAYOUT.STATS_OFFSET_Y);
    }

    // Find and reposition buttons
    const buttons = this.findGameOverButtons();
    if (buttons.length === 2) {
      const buttonSpacing = UIConfig.LAYOUT.BUTTON_SPACING;
      const buttonY = centerY + UIConfig.LAYOUT.BUTTON_ROW_OFFSET_Y;
      buttons[0].setPosition(centerX - buttonSpacing / 2, buttonY);
      buttons[1].setPosition(centerX + buttonSpacing / 2, buttonY);
    }
  }

  private findStatsText(): Phaser.GameObjects.Text | undefined {
    return this.uiContainer.getAll().find(
      obj => obj instanceof Phaser.GameObjects.Text &&
             obj.text?.startsWith("Final Score:")
    ) as Phaser.GameObjects.Text | undefined;
  }

  private findGameOverButtons(): Phaser.GameObjects.Container[] {
    return this.uiContainer.list.filter(
      obj => obj instanceof Phaser.GameObjects.Container &&
            obj.list.some(child =>
              child instanceof Phaser.GameObjects.Text &&
              ["Play Again", "Main Menu"].includes(child.text)
            )
    ) as Phaser.GameObjects.Container[];
  }

  /** Destroy UI and clean up */
  destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this);
    this.uiContainer.destroy(true);
    this.logger.debug("UIRenderer destroyed");
  }
}