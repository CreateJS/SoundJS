import Sound from "./Sound";
import Declicker from "./utils/Declicker"
import AbstractAudioWrapper from "./AbstractAudioWrapper";

class Playback extends AbstractAudioWrapper {

	get elapsed() {
		let ctx = Sound.context;
		if(this._paused){
			return this._positionOffset - this.offset - this._remainingDelay;
		}else{
			return ctx.currentTime - this._startTime + this._positionOffset - this.offset;
		}
	}

	get position(){
		let ctx = Sound.context;
		if(this._paused){
			return this._positionOffset;
		}else{
			if(this.elapsed < 0){
				// If we're counting down during a delay, show where we'll start playing.
				return this.offset;
			}else{
				return ctx.currentTime - this._startTime + this._positionOffset;
			}
		}
	}

	get duration() {
		return this.buffer.duration;
	}

	get playing() {
		return Boolean(this._sourceNode) && !this.paused && !this._stopping;
	}

	set paused(val){
		if(val){
			this.pause();
		}else{
			this.resume();
		}
	}

	get paused() {
		return this._pausing || this._paused;
	}

	constructor(audioBuffer, options = {}) {
		super();
		let ctx = Sound.context;

		this.fademaskerNode = ctx.createGain();
		this.fademaskerNode.connect(this.fxBus);

		this.declicker = new Declicker(this.fademaskerNode);
		this.declicker.on("fadeOutComplete", this.handleFadeMaskComplete, this);
		// Currently no need to listen to the fade-in complete.

		// Internal playback data tracking
		this.buffer = audioBuffer;
		this._startTime = null;
		this._positionOffset = 0; // Progress offset. Essentially, 'where will this start playing again if we resume', but also used in calculations while a sound is playing.
		this._remainingDelay = 0; // If paused during a delay, this tracks how much delay is left when resumed.
		this._paused   = false;
		this._pausing  = false;
		this._stopping = false;

		// Play properties

		let loops = Number(options.loops);
		this.remainingLoops = loops ? Math.max(loops | 0, -1) : 0;

		this.delay   = isNaN(Number(options.delay )) ? 0 : Number(options.delay);			// 0 default
		this.offset  = isNaN(Number(options.offset)) ? 0 : Number(options.offset);		// 0 default
		this.playDuration = options.playDuration;																	// No default needed, undefined and null are both valid values
		this.playbackRate = isNaN(Number(options.playbackRate)) ? 1 : Number(options.playbackRate);
		this.detune = isNaN(Number(options.detune)) ? 0 : Number(options.detune);

		this._play(this.delay, this.offset, this.playDuration);
	}

	// duration now defaults to buffer duration - iOS/Safari throws a dom exception 11 if a source node is told to start with undefined duration.
	_play(delay = 0, offset = 0, duration = this.buffer.duration) {
		let ctx = Sound.context;

		if (this._sourceNode) {
			return; // Do nothing - sound is already playing. Playing multiple sounds should be done by playing the sample again.
		}

		if(duration === null){
			duration = this.buffer.duration; // Makes a null value result in 'play until the end of the buffer' instead of 0 play duration.
		}

		this.fademaskerNode.gain.value = 0;
		this._sourceNode || this._createSourceNode();
		this._sourceNode.playbackRate.value = this.playbackRate;
		this._sourceNode.detune.value = this.detune;
		this._sourceNode.start(ctx.currentTime + delay, offset, duration);
		this.declicker.fadeIn();

		this._startTime = ctx.currentTime + delay;
		this._positionOffset = offset;
		this._paused = false;
	}

	_createSourceNode() {
		let ctx = Sound.context;

		this._sourceNode = ctx.createBufferSource();
		this._sourceNode.buffer = this.buffer;
		this._sourceNode.connect(this.fademaskerNode);

		this._sourceNode.onended = this.handleEnded.bind(this);
	}

	loop() {
		this._sourceNode = null;
		this._play(0, this.offset, this.playDuration);
		if (this.remainingLoops > 0) {
			this.remainingLoops--;
		}
	}

	pause() {
		if (!this.playing) { // This checks for paused, pausing, stopping and stopped.
			return;
		}

		if(this.declicker.isFadingIn){
			// We're okay cancelling a fade-in to pause.
			this.declicker.cancelFade();
		}

		this.dispatchEvent("paused");
		this._pausing = true;
		this.declicker.fadeOut();
	}

	resume() {
		if(this._stopping){
			// Do nothing - interrupting a stop is not allowed.
		}else if(this._paused){
			this._play(this._remainingDelay, this._positionOffset);
			this._paused = false;
		}else if(this._pausing){
			this.declicker.cancelFade();
			this._pausing = false;
		}

		// Implicitly does nothing if the sound is neither paused nor pausing.
	}

	_pauseCore() {
		this._positionOffset = this.position;
		if(this.elapsed < 0){
			this._remainingDelay = -this.elapsed;
		}else{
			this._remainingDelay = 0;
		}

		this._sourceNode.stop();
		this._sourceNode = null;
		this._pausing = false;
		this._paused = true;
	}

	stop() {
		if (this._stopping) { // Already stopping - don't need to stop again.
			return;
		}

		if(this._paused){
			this._stopCore(); // Not playing currently - can stop immediately.
			this.dispatchEvent("stopped");
			return;
		}

		this.dispatchEvent("stopped");
		this._stopping = true;
		this.declicker.fadeOut();
	}

	_stopCore() {
		// after the declick fade, do the actual stopping part.
		this._stopping = false;
		this.destroy(); // An "end" event will be dispatched in response to the _sourceNode being told to stop in the destroy function, so is not needed here.
	}

	destroy() {
		if (this._sourceNode) {
			this._sourceNode.onended = null; // Stop listening before stopping the node, since the listener does things we don't want for a destroyed sound
			this._sourceNode && this._sourceNode.stop();
		}
		this.dispatchEvent("end"); // Manually dispatch the end event since the listener has been removed
		this._sourceNode = null;
		this._paused = false;
		this.dispatchEvent("destroyed");
		// TODO: review approach for preventing future plays.
		this._play = () => {
			throw new Error("Cannot play Playback after it has been destroyed.")
		};
		this.removeAllEventListeners();
		this.declicker.removeAllEventListeners();
	}

	handleEnded() {
		if (this.paused) {
			// Do nothing - the buffer just sent an ended event, but this is because the Playback was just paused,
			// and the pause function already dispatched a pause event.
		} else {
			// Reached end of playback. Loop if we have remaining loops - destroy otherwise.

			if (this.remainingLoops !== 0) {
				this.dispatchEvent("end");
				this.loop();
			} else {
				// No event here - the destroy function dispatches an end event.
				this.destroy();
			}
		}
	}

	handleFadeMaskComplete(){
		if(this._stopping){
			this._stopCore();
		}else if(this._pausing) {
			this._pauseCore();
		}
	}

}

export default Playback;
