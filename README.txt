The SoundJS JavaScript library provides a simple API, and some powerful features to make working with audio a breeze.

- .add() - Too many sound instances on page (combined between all sounds) will stop sound working, this varies on browser/hardware safest number is found max of 35 channels

- .play() - Too many playing instances (combined between all sounds) will stop sound working till all windows are closed. The exact number is undefined but has been observed as low as 10 looping sounds in Chrome.
