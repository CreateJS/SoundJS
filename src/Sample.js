import Sound from "./Sound";
import Playback from "./Playback";
import AbstractAudioWrapper from "./AbstractAudioWrapper";

class Sample extends AbstractAudioWrapper {

	get elapsed(){
		if(this.playbacks.length === 0) { return 0; }
		return this.playbacks[this.playbacks.length-1].elapsed;
	}

	get position(){
		if(this.playbacks.length === 0) { return 0; }
		return this.playbacks[this.playbacks.length-1].position;
	}

	set paused(val){
		if(val){
			this.pause();
		}else{
			this.resume();
		}
	}

	get paused(){
		if(this.playbacks.length < 1){
			return false;
		}

		for(let i = 0; i < this.playbacks.length; i++){
			if(!this.playbacks[i].paused){
				return false;
			}
		}

		return true;
	}

	set loops(val){
		this._loops = val;
	}

	get loops(){
		return this._loops;
	}

	get duration() {
		return this.audioBuffer ? this.audioBuffer.duration : null;
	}

	constructor(src, options = {}, parent = Sound._rootGroup) {
		super();
		let ctx = Sound.context;

		this.playbacks = [];

		this.audioBuffer = null;
		this._playbackRequested = false;

		this.src = null;

		this.volume  = isNaN(Number(options.volume)) ? 1 : Number(options.volume); 		// 1 default
		this.loops   = isNaN(Number(options.loops )) ? 0 : Math.max(Number(options.loops) | 0, -1);		// 0 default, >= -1, integers only
		this.delay   = isNaN(Number(options.delay )) ? 0 : Number(options.delay);			// 0 default
		this.pan     = isNaN(Number(options.pan   )) ? 0 : Number(options.pan); 			// 0 default
		this.offset  = isNaN(Number(options.offset)) ? 0 : Number(options.offset);		// 0 default

		this.playDuration = options.playDuration; 																		// No default needed, undefined means "play until end"

		this._resolveSource(src);

		this.parent = null; // Set to null here only to show that this variable exists on Samples. Samples should always have a parent group.
		parent.add(this);
	}

	_resolveSource(src) {
		let ctx = Sound.context;

		if (src instanceof ArrayBuffer) {
			ctx.decodeAudioData(src, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
		} else if (src instanceof AudioBuffer) {
			this.audioBuffer = src;
		} else if (typeof src === "string") {
			if (/^data:.*?,/.test(src)) { // Test for Data URL
				// Data URLs can just be loaded by XHR, so pass it in
				this.loadAudio(src);
			} else {
				// Assumed to be a regular url at this point
				this.src = this._ensureValidFileExtension(src);
				this.loadAudio(this.src);
			}
		} else if (src instanceof Array) {
			for (let i = 0; i < src.length; i++) {
				let u = src[i];
				if (Sound.isExtensionSupported(u, false)) {
					this.src = u;
					this.loadAudio(this.src);
					break;
				}
			}
		} else if (typeof src === "object") {
			// Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
			for (let ext in src) {
				if (!src.hasOwnProperty(ext)) {
					continue;
				}
				if (Sound.isExtensionSupported(ext, false)) {
					this.src = src[ext];
					this.loadAudio(this.src);
					break;
				}
			}
		}
	}

	_ensureValidFileExtension(url) {
		// Not a data URL, so let's doublecheck the file extension before loading.
		let extensionExp = /\.\w+$/;
		let result = extensionExp.exec(url);
		if (result === null) {
			// No file extension, so add one
			url = url.concat("." + Sound.fallbackFileExtension);
		} else {
			// Found a file extension. Check if it's supported. If it's definitely not, fall back.
			let extension = result[0].substr(1);
			if (!Sound.isExtensionSupported(extension, false)) {
				url = url.replace(extensionExp, "." + Sound.fallbackFileExtension);
			}
		}
		return url;
	}

	clone() {
		let o = new Sample(this.audioBuffer);
		o.volume = this.volume;
		o.pan = this.pan;
		o.loops = this.loops;
		o.delay = this.delay;
		o.offset = this.offset;
		o.interrupt = this.interrupt;
		// TODO: clone FX chain, other properties
		return o;
	}

	/**
	 * Play the sample. This creates and starts a new Playback of the sample, if it's loaded. If it's not loaded, calling this function
	 * will make the Sample play when it finishes loading. A sample will only play once when it finishes loading, no matter how many
	 * times play was called.
	 * @returns {*}
	 */
	play(playProps) {
		if (!this.audioBuffer) {
			this._playbackRequested = true;
			this._requestedPlaybackPlayprops = playProps;
			return null;
		} else {
			return this._play(playProps);
		}
	}

	_play(playProps) {
		playProps = playProps || {loops: this.loops, playDuration: this.playDuration, offset: this.offset, delay: this.delay};
		let pb = new Playback(this.audioBuffer, playProps);

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
	pause() {
		this.playbacks.slice().forEach((pb) => pb.pause());
	}

	/**
	 * Resume all paused playbacks of this sample.
	 */
	resume() {
		this.playbacks.slice().forEach((pb) => pb.resume());
	}

	/**
	 * Stop all playbacks of this sample, destroying them.
	 */
	stop() {
		this.playbacks.slice().forEach((pb) => pb.stop());
	}

	// Loading and Decoding

	loadAudio(url) {
		let request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';
		request.onload = this.handleAudioLoaded.bind(this);
		request.send();
	}

	/**
	 * Destroy this sample. Halts and destroys all playbacks, and dispatches a destruction event, which should be reacted
	 * to by any containers (e.g. Groups or any external tracking) containing this sample by removing it from their lists
	 * so it can be garbage collected.
	 */
	destroy() {
		this.stop();
		// TODO: review approach for preventing future plays.
		this._play = () => {
			throw new Error("Cannot play Sample after it has been destroyed.")
		};
		this.dispatchEvent("destroyed");
		this.removeAllEventListeners();
	}

	handleAudioLoaded(loadEvent) {
		let xhr = loadEvent.target;
		if(xhr.readyState === 4 && xhr.status === 200){
			let ctx = Sound.context;
			let result = loadEvent.target.response;
			ctx.decodeAudioData(result, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
		}
	}

	handleAudioDecoded(buffer) {
		this.audioBuffer = buffer;

		this.dispatchEvent("ready");

		if (this._playbackRequested) {
			this._play(this._requestedPlaybackPlayprops);
		}
	}

	handleAudioDecodeError(e) {
		console.warn("Error decoding audio data in Sample.")
	}

	handlePlaybackEnd(e) {
		this.dispatchEvent("playbackEnd");
	}

	handlePlaybackStopped(e) {
		this.dispatchEvent("playbackStop");
	}

	handlePlaybackDestroyed(e) {
		let index = this.playbacks.indexOf(e.target);
		if (index > -1) {
			this.playbacks.splice(index, 1);
		}
		this.dispatchEvent("playbackDestroyed")
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// SoundJS 1.0 Parity


	makePlayPropsObj(){
		return {
			volume:    this.volume,
			loops:     this.loops,
			delay:     this.delay,
			pan:       this.pan,
			offset:    this.offset,
			interrupt: this.interrupt,
			duration:  this.playDuration
		};
	}

	consumePlayPropsObj(o){
		if(!o){return;}

		this.volume  = isNaN(Number(o.volume)) ? this.volume : Number(o.volume);
		this.loops   = isNaN(Number(o.loops )) ? this.loops  : Math.max(Number(o.loops) | 0, -1);		// must be >= -1, and an integer
		this.delay   = isNaN(Number(o.delay )) ? this.delay  : Number(o.delay);
		this.pan     = isNaN(Number(o.pan   )) ? this.pan    : Number(o.pan);
		this.offset  = isNaN(Number(o.offset)) ? this.offset : Number(o.offset);

		this.interrupt = (  o.interrupt === undefined ? this.interrupt : o.interrupt);
		this.playDuration = o.hasOwnProperty('playDuration') ? o.playDuration : this.playDuration;	// "undefined" is a valid value (means play to end). Null, in SJS2, also means play to end.
	}

}

export default Sample;
