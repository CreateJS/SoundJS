import Sound from "./Sound";
import {EventDispatcher} from "./main";

export default class Playback extends EventDispatcher {

    get elapsed(){
        let ctx = Sound.context;
        return ctx.currentTime - this._startTime + this._elapsedOffset
    }

    get duration(){ return this.buffer.duration; }
    get playing(){ return Boolean(this._sourceNode); }
    get paused(){ return this._paused; }

    constructor(audioBuffer){
        super();

        let ctx = Sound.context;

        // Audio tree setup
        this.outputNode = this.volumeNode = ctx.createGain();
        this.fxBus = ctx.createGain();
        this.fxBus.connect(this.outputNode);

        // Data tracking
        this.buffer = audioBuffer;
        this._startTime = null;
        this._elapsedOffset = 0; // The amount of time elapsed, including pauses.
        this._paused = false;

        this._play(); // TODO: 10ms fade in to prevent clicks
    }

    _play(delay = 0, offset = 0){
        let ctx = Sound.context;

        if(this._sourceNode){
            return; // Do nothing - sound is already playing. Playing multiple sounds should be done by playing the sample again.
        }

        this._sourceNode || this._createSourceNode();
        this._sourceNode.start(delay, offset);

        this._startTime = ctx.currentTime;
        this._elapsedOffset = offset;
        this._paused = false;
    }

    _createSourceNode(){
        let ctx = Sound.context;

        this._sourceNode = ctx.createBufferSource();
        this._sourceNode.buffer = this.buffer;
        this._sourceNode.connect(this.outputNode);

        this._sourceNode.onended = this.handleEnded.bind(this);
    }

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

    destroy(){
        this._sourceNode && this._sourceNode.stop();
        this._sourceNode = null;
        this._paused = false;
        this.dispatchEvent("destroyed");
    }

    handleEnded(){
        if(this.paused){
            // Do nothing - the buffer just sent an ended event, but this is because the Playback was just paused,
            // and the pause function already dispatched an event.
        }else{
            this.dispatchEvent("ended");
            this.destroy();
        }

    }
}