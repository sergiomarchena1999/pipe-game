
/** Helper funtion for creating buttons */
export function createPanelButton(
  x: number, 
  y: number, 
  text: string, 
  onClick: () => void,
  scene: Phaser.Scene,
  spriteKey: string = "button-orange"
  ): Phaser.GameObjects.Container {

  // Create the button sprite
  const buttonSprite = scene.add.image(0, 0, spriteKey).setOrigin(0.5).setScale(1.1, 1.3);
  
  // Create the text on top
  const buttonText = scene.add.text(0, 0, text, {
    fontSize: "22px",
    color: "#fff",
    fontFamily: "Jersey10"
  }).setOrigin(0.5);

  // Combine them in a container
  const buttonContainer = scene.add.container(x, y, [buttonSprite, buttonText])
    .setSize(buttonSprite.width, buttonSprite.height)
    .setInteractive({ useHandCursor: true })
    .setAlpha(1);

  // Pointer effects
  buttonContainer.on("pointerover", () => {
    scene.tweens.add({ targets: buttonContainer, scale: 1.1, duration: 100 });
  });
  buttonContainer.on("pointerout", () => {
    scene.tweens.add({ targets: buttonContainer, scale: 1, duration: 100 });
  });
  buttonContainer.on("pointerdown", onClick);

  return buttonContainer;
}