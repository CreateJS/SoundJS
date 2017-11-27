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

    constructor(url, parent = Sound._rootGroup){
        super();
        let ctx = Sound.context;
        this.outputNode = this.volumeNode = ctx.createGain();
        this.fxBus = ctx.createGain();

        this.fxBus.connect(this.outputNode); // TODO: Manage effects chain.

        this.playbacks = [];

        this.audioBuffer = null;
        this._playbackRequested = false;

        if(url){
            this.loadAudio(url);
        }

        if(parent){
            parent.add(this);
        }
    }

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
        return pb;
    }

    pause(){
        this.playbacks.forEach( (pb) => pb.pause() );
    }

    resume(){
        this.playbacks.forEach( (pb) => pb.resume() );
    }

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
}