import Sound from "./Sound";

export default class Playback {

    constructor(audioBuffer, playImmediately = true){
        let ctx = Sound.context;

    get duration(){ return this.buffer.duration; }
    get playing(){ return Boolean(this._sourceNode); }
    get paused(){ return this._paused; }

        this.outputNode = this.volumeNode = ctx.createGain();
        this.fxBus = ctx.createGain();

        this.fxBus.connect(this.outputNode);

        this._sourceNode = ctx.createBufferSource();
        this._sourceNode.buffer = audioBuffer;

        this._sourceNode.connect(this.outputNode);
        playImmediately && this._sourceNode.start(0); // TODO: 10ms fade in to prevent clicks
    pause(){
        if(!this.playing){ return; }

        this._elapsedOffset = this.elapsed;
        this._sourceNode.stop();
        this._sourceNode = null;
        this._paused = true;
    }

    resume(){
        if(!this.paused){ return; }

        this.dispatchEvent("paused");
        this._play(0, this._elapsedOffset);
        this._paused = false;
    }

    stop(){
        this.destroy();
    }

    }
}