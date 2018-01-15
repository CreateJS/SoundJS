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

    get duration(){
        return this.audioBuffer ? this.audioBuffer.duration : null;
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

        this.src = null;


        if(url instanceof ArrayBuffer){
            ctx.decodeAudioData(url, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
        }else if(url instanceof AudioBuffer){
            this.audioBuffer = url;
        }else if(typeof url === "string"){
            if(/^data:.*?,/.test(url)){ // Test for Data URL
                // Data URLs can just be loaded by XHR, so pass it in
                this.loadAudio(url);
            }else{
                // Assumed to be a regular url at this point
                this.src = this._ensureValidFileExtension(url);
                this.loadAudio(this.src);
            }
        }else if( url instanceof Array){
            for(let i = 0; i < url.length; i++){
                let u = url[i];
                if(Sound.isExtensionSupported(u, false)){
                    this.src = u;
                    this.loadAudio(this.src);
                    break;
                }
            }
        }else if( typeof url === "object" ){
            // Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
            for(let ext in url){
                if(!url.hasOwnProperty(ext)){continue;}
                if(Sound.isExtensionSupported(ext, false)){
                    this.src = url[ext];
                    this.loadAudio(this.src);
                    break;
                }
            }
        }

        if(parent){
            parent.add(this);
        }
    }

    _ensureValidFileExtension(url){
        // Not a data URL, so let's doublecheck the file extension before loading.
        let extensionExp = /\.\w+$/;
        let result = extensionExp.exec(url);
        if(result === null){
            // No file extension, so add one
            url = url.concat("." + Sound.fallbackFileExtension);
        }else{
            // Found a file extension. Check if it's supported. If it's definitely not, fall back.
            let extension = result[0].substr(1);
            if(!Sound.isExtensionSupported(extension)){
                url = url.replace(extensionExp, "." + Sound.fallbackFileExtension);
            }
        }
        return url;
    }

    clone(){
        let o = new Sample(this.audioBuffer);
        o.volume = this.volume;
        o.pan = this.pan;
        // TODO: clone FX chain
        return o;
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

        pb.addEventListener("end", this.handlePlaybackEnd.bind(this));
        pb.addEventListener("stop", this.handlePlaybackStopped.bind(this));
        pb.addEventListener("destroyed", this.handlePlaybackDestroyed.bind(this));

        return pb;
    }

    /**
     * Pause all playbacks of this sample.
     */
    pause(){
        this.playbacks.slice().forEach( (pb) => pb.pause() );
    }

    /**
     * Resume all paused playbacks of this sample.
     */
    resume(){
        this.playbacks.slice().forEach( (pb) => pb.resume() );
    }

    /**
     * Stop all playbacks of this sample, destroying them.
     */
    stop(){
        this.playbacks.slice().forEach( (pb) => pb.stop() );
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

        this.dispatchEvent("ready");

        if(this._playbackRequested){
            this._play();
        }
    }

    handleAudioDecodeError(e){
        console.warn("Error decoding audio data in Sample. ")
    }

    handlePlaybackEnd(e){
        this.dispatchEvent("playbackEnd");
    }

    handlePlaybackStopped(e){
        this.dispatchEvent("playbackStop");
    }

    handlePlaybackDestroyed(e){
        let index = this.playbacks.indexOf(e.target);
        if(index > -1){
            this.playbacks.splice(index, 1);
        }
        this.dispatchEvent("playbackDestroyed")
    }
}