import Sound from "./Sound";
import EventDispatcher from "@createjs/core/src/events/EventDispatcher";

class Playback extends EventDispatcher {

	get elapsed() {
		let ctx = Sound.context;
		return ctx.currentTime - this._startTime + this._elapsedOffset
	}

	get duration() {
		return this.buffer.duration;
	}

	get playing() {
		return Boolean(this._sourceNode);
	}

	get paused() {
		return this._paused;
	}

	constructor(audioBuffer, options = {}) {
		super();

		let ctx = Sound.context;

		this.fademaskDuration = 0.02;
		this.fademaskCallback = null;

		// Audio tree setup
		this.outputNode = this.faderNode = ctx.createGain();

		this.volumeNode = ctx.createGain();
		this.volumeNode.connect(this.outputNode);

		this.fademaskerNode = ctx.createGain();
		this.fademaskerNode.connect(this.volumeNode);

		this.fxBus = ctx.createGain();
		this.fxBus.connect(this.fademaskerNode);

		// Data tracking
		this.buffer = audioBuffer;
		this._startTime = null;
		this._elapsedOffset = 0; // The amount of time elapsed, including pauses.
		this._paused = false;

		this.remainingLoops = options.loops ? Math.max(options.loops | 0, -1) : 0;

		this._play(); // TODO: 10ms fade in to prevent clicks
	}

	_play(delay = 0, offset = 0) {
		let ctx = Sound.context;

		if (this._sourceNode) {
			return; // Do nothing - sound is already playing. Playing multiple sounds should be done by playing the sample again.
		}

		this.fademaskerNode.gain.value = 0;
		this._sourceNode || this._createSourceNode();
		this._sourceNode.start(delay, offset);
		this._fademaskIn();

		this._startTime = ctx.currentTime;
		this._elapsedOffset = offset;
		this._paused = false;
	}

	/**
	 * Fade-mask the sound with a 10ms fade-in as it starts to play. Also known as declicking. This prevents audible 'click' sounds caused by
	 * an audio sample
	 * @private
	 */
	_fademaskIn() {
		this.fademaskerNode.gain.value = 0;
		this.fademaskerNode.gain.linearRampToValueAtTime(1, createjs.Sound.context.currentTime + this.fademaskDuration);

	}

	_fademaskOut() {
		this.fademaskerNode.gain.value = 1;
		this.fademaskerNode.gain.linearRampToValueAtTime(0, createjs.Sound.context.currentTime + this.fademaskDuration);
		//this.fademaskerNode.gain.setTargetAtTime(0, createjs.Sound.context.currentTime, 1);

		if (this.fademaskCallback) {
			//this.fademaskCallback.apply(this)
			window.setTimeout( () => { this.fademaskCallback.apply(this); this.fademaskCallback = null;}, (this.fademaskDuration * 1100) | 0)
		}
	}

	_createSourceNode() {
		let ctx = Sound.context;

		this._sourceNode = ctx.createBufferSource();
		this._sourceNode.buffer = this.buffer;
		this._sourceNode.connect(this.fxBus);

		this._sourceNode.onended = this.handleEnded.bind(this);
	}

	pause() {
		if (!this.playing) {
			return;
		}

		// this.dispatchEvent("paused");
		if (this.fademaskDuration > 0) {
			this.requestFademaskCallback(this._pauseCore);
			this._fademaskOut();
		}
	}

	_pauseCore() {
		this._elapsedOffset = this.elapsed;

		this._sourceNode.stop();
		this._sourceNode = null;
		this._paused = true;
	}

	resume() {
		if (!this.paused) {
			return;
		}

		this._play(0, this._elapsedOffset);
		this._paused = false;
	}

	loop() {
		this._sourceNode = null;
		this._play(0, 0); // TODO: delay and offeset?
		if (this.remainingLoops !== -1) {
			this.remainingLoops--;
		}

	}

	stop() {
		// change this to just kick off the fadeout. Need to check and set flags, too.
		this.dispatchEvent("stop");
		this.destroy(); // An event will be dispatched in response to the _sourceNode being told to stop in the destroy function, so nothing is dispatched here.
	}

	_stopCore() {
		// after the crossfade, do the actual stopping part.
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
	}

	handleEnded() {
		if (this.paused) {
			// Do nothing - the buffer just sent an ended event, but this is because the Playback was just paused,
			// and the pause function already dispatched an event.
		} else {
			// Reached end of playback. Loop if we have remaining loops - destroy otherwise.

			if (this.remainingLoops > 0) {
				this.dispatchEvent("end");
				this.loop();
			} else {
				// No event here - the destroy function dispatches an end event.
				this.destroy();
			}

		}

	}

	requestFademaskCallback(callbackFunc) {
		let priorityOrder = [this._stopCore, this._pauseCore];

		for (let i = 0; i < priorityOrder.length; i++) {
			let p = priorityOrder[i];
			if (this.fademaskCallback === p) {
				// The current callback is higher priority, so don't change.
				return false;
			} else if (callbackFunc === p) {
				// The new callback is okay
				this.fademaskCallback = callbackFunc;
				return true;
			}
		}

		// No valid callback
		return false;
	}
}

export default Playback;
