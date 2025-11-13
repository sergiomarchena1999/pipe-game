/** 
 * Returns a random number from given interval
 * Both min and max are INCLUDED
 */
export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/** Dynamically loads a TTF font into the document and waits until it's ready. */
export function loadTTF(name: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Inject @font-face CSS
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(`
      @font-face {
        font-family: '${name}';
        src: url('${url}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `));
    document.head.appendChild(style);

    // Wait for font to be loaded
    document.fonts.load(`16px '${name}'`).then(() => resolve()).catch(reject);
  });
}