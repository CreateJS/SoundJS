import Sound from "./Sound";
import Playback from "./Playback";
import EventDispatcher from "@createjs/core/src/events/EventDispatcher";

class Sample extends EventDispatcher {

	set volume(val) {
		this.volumeNode.gain.value = val;
	}

	get volume() {
		return this.volumeNode.gain.value;
	}

	set pan(val) {
		this.panNode.pan.value = val;
	}

	get pan() {
		return this.panNode.pan.value;
	}

	set muted(val){
		this._muted = Boolean(val);
	}

	get muted(){
		return this._muted;
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

	set parent(val) {
		this._parent = val;
		this.outputNode.connect(parent.inputNode);
	}

	get parent() {
		return this._parent;
	}

	constructor(src, options = {}, parent = Sound._rootGroup) {
		super();
		let ctx = Sound.context;
		this.outputNode = this.volumeNode = ctx.createGain();

		this.panNode = this.postFxNode = ctx.createStereoPanner();
		this.panNode.connect(this.outputNode);

		this.fxBus = ctx.createGain();
		this.fxBus.connect(this.panNode); // TODO: Manage effects chain.

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

		this._effects = [];

		this._resolveSource(src);

		this.muted = false;
		this.paused = false;

		if (parent) {
			parent.add(this);
		}
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
		// TODO: clone FX chain, other properties
		return o;
	}

	/**
	 * Play the sample. This creates and starts a new Playback of the sample, if it's loaded. If it's not loaded, calling this function
	 * will make the Sample play when it finishes loading. A sample will only play once when it finishes loading, no matter how many
	 * times play was called.
	 * @returns {*}
	 */
	play() {
		if (!this.audioBuffer) {
			this._playbackRequested = true;
			return null;
		} else {
			return this._play();
		}
	}

	_play() {
		let pb = new Playback(this.audioBuffer, {loops: this.loops, playDuration: this.playDuration, offset: this.offset, delay: this.delay});

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
		let ctx = Sound.context;
		let result = loadEvent.target.response;
		ctx.decodeAudioData(result, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
	}

	handleAudioDecoded(buffer) {
		this.audioBuffer = buffer;

		this.dispatchEvent("ready");

		if (this._playbackRequested) {
			this._play();
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
			duration:  this.playDuration,
			pan:       this.pan,
			interrupt: this.interrupt,
			offset:    this.offset
		};
	}

	consumePlayPropsObj(o){
		this.volume  = isNaN(Number(o.volume)) ? this.volume : Number(o.volume);
		this.loops   = isNaN(Number(o.loops )) ? this.loops  : Math.max(Number(o.loops) | 0, -1);		// must be >= -1, and an integer
		this.delay   = isNaN(Number(o.delay )) ? this.delay  : Number(o.delay);
		this.pan     = isNaN(Number(o.pan   )) ? this.pan    : Number(o.pan);
		this.offset  = isNaN(Number(o.offset)) ? this.offset : Number(o.offset);

		this.interrupt = (  o.interrupt === undefined ? this.interrupt : o.interrupt);
		this.playDuration = o.hasOwnProperty('playDuration') ? o.playDuration : this.playDuration;	// "undefined" is a valid value (means play to end). Null, in SJS2, also means play to end.
	}

	addEffect(effect){
		effect.connect(this.outputNode);
		this.fxBus.disconnect();
		this.fxBus.connect(effect.inputNode);
	}

	set effects(effects){
		this.removeAllEffects();

		if(!effects || !effects.length){
			// Valid data or empty array required (and the array was emptied in removeAllEffects above)
			return;
		}

		// Check that all the individual effects are valid:
		for(let i = 0; i < effects.length; i++){
			let e = effects[i];
			if(e.owner){
				throw new Error("Error adding Effects - An effect in the provided list at index " + i +  " is already added to another Group, Sample, or Playback."
					+ "  Effects can be cloned to be used in multiple places, or alternately, can be placed on Groups to apply to all Samples in the Group.")
			}
		}

		// Store the effects list and connect up the audio graph of the effect chain:

		let firstEffect = effects[0];
		firstEffect.owner = this;
		this._effects.push(firstEffect);

		this.fxBus.disconnect();
		this.fxBus.connect(firstEffect.inputNode);

		for(let j = 1 ; j < effects.length; j++){
			let e = effects[j];
			effects[j-1].connect(e);
			e.owner = this;
			this._effects.push(e);
		}
		effects[effects.length-1].connect(this.postFxNode);

	}

	removeAllEffects(){
		this.fxBus.disconnect();
		for(let i = 0; i < this._effects.length; i++){
			let e = this._effects[i];
			e.owner = null;
			e.disconnect();
		}
		this.fxBus.connect(this.postFxNode);

		this._effects.splice(0, this._effects.length); // Empty the array in place
	}


}

export default Sample;
