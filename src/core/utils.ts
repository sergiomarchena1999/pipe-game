/** 
 * Returns a random number from given interval
 * Both min and max are INCLUDED
 */
export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}