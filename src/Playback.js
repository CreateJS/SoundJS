import Sound from "./Sound";

export default class Playback {

    constructor(audioBuffer, playImmediately = true){
        let ctx = Sound.context;
        this.outputNode = this.volumeNode = ctx.createGain();
        this.fxBus = ctx.createGain();

        this.fxBus.connect(this.outputNode);

        this._sourceNode = ctx.createBufferSource();
        this._sourceNode.buffer = audioBuffer;

        this._sourceNode.connect(this.outputNode);
        playImmediately && this._sourceNode.start(0); // TODO: 10ms fade in to prevent clicks
    }
}