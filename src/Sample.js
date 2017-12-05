import Sound from "./Sound";
import Playback from "./Playback";
import {EventDispatcher} from "./main";

export default class Sample extends EventDispatcher {

    set volume(val){
        this.volumeNode.gain.value = val;
    }

    get volume(){
        return this.volumeNode.gain.value;
    }

    set pan(val){
        this.panNode.pan.value = val;
    }

    get pan(){
        return this.panNode.pan.value;
    }

    constructor(url, parent = Sound._rootGroup){
        super();
        let ctx = Sound.context;
        this.outputNode = this.volumeNode = ctx.createGain();

        this.panNode = ctx.createStereoPanner();
        this.panNode.connect(this.outputNode);

        this.fxBus = ctx.createGain();
        this.fxBus.connect(this.panNode); // TODO: Manage effects chain.

        this.playbacks = [];

        this.audioBuffer = null;
        this._playbackRequested = false;


        if(url instanceof ArrayBuffer){
            ctx.decodeAudioData(url, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
        }else if(url instanceof AudioBuffer){
            this.audioBuffer = url;
        }else if(typeof url === "string"){
            this.loadAudio(url); // This works for data URLs too
        }

        if(parent){
            parent.add(this);
        }
    }

    /**
     * Play the sample. This creates and starts a new Playback of the sample, if it's loaded. If it's not loaded, calling this function
     * will make the Sample play when it finishes loading. A sample will only play once when it finishes loading, no matter how many
     * times play was called.
     * @returns {*}
     */
    play(){
        if(!this.audioBuffer){
            this._playbackRequested = true;
            return null;
        }else{
            return this._play();
        }
    }

    _play(){
        let pb = new Playback(this.audioBuffer);

        this.playbacks.push(pb);
        pb.outputNode.connect(this.fxBus);

        pb.addEventListener("destroyed", this.handlePlaybackDestroyed.bind(this));

        return pb;
    }

    /**
     * Pause all playbacks of this sample.
     */
    pause(){
        this.playbacks.forEach( (pb) => pb.pause() );
    }

    /**
     * Resume all paused playbacks of this sample.
     */
    resume(){
        this.playbacks.forEach( (pb) => pb.resume() );
    }

    /**
     * Stop all playbacks of this sample, destroying them.
     */
    stop(){
        this.playbacks.forEach( (pb) => pb.stop() );
    }

    // Loading and Decoding

    loadAudio(url){
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = this.handleAudioLoaded.bind(this);
        request.send();
    }

    handleAudioLoaded(loadEvent){
        let ctx = Sound.context;
        let result = loadEvent.target.response;
        ctx.decodeAudioData(result, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
    }

    handleAudioDecoded(buffer){
        this.audioBuffer = buffer;

        if(this._playbackRequested){
            this._play();
        }
    }

    handleAudioDecodeError(e){
        console.log("Error decoding audio data.")
    }

    handlePlaybackDestroyed(e){
        let index = this.playbacks.indexOf(e.target);
        if(index > -1){
            this.playbacks.splice(index, 1);
        }
        this.dispatchEvent("playbackDestroyed")
    }
}