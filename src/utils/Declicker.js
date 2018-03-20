import EventDispatcher from "@createjs/core/src/events/EventDispatcher";
import Sound from "../Sound";

export default class Declicker extends EventDispatcher {

	constructor(gainNode){
		super();

		// The node we will use for fading to prevent clicks. Use provided node if exists, otherwise create one.
		this.gainNode = this.inputNode = this.outputNode = gainNode || Sound.context.createGain();

		this.fadeMaskDuration = 0.02; // Duration of the fade, in seconds.
		this.fadeMaskTimeout = null;  // Reference to the timeout for calling an event, to allow cancelling
	}

	fadeOut(){
		if(this.fadeMaskTimeout){
			return; // Do nothing if we're already fading.
		}
		this.gainNode.gain.value = 1;
		this.gainNode.gain.linearRampToValueAtTime(0, Sound.context.currentTime + this.fadeMaskDuration);

		this.fadeMaskTimeout = window.setTimeout( () => {
			this.dispatchEvent("fadeOutComplete");
			this.fadeMaskTimeout = null;
		}, (this.fadeMaskDuration * 1100) | 0);
	}

	fadeIn(){
		if(this.fadeMaskTimeout){
			return; // Do nothing if we're already fading.
		}

		this.gainNode.gain.value = 0;
		this.gainNode.gain.linearRampToValueAtTime(1, Sound.context.currentTime + this.fadeMaskDuration);

		this.fadeMaskTimeout = window.setTimeout( () => {
			this.dispatchEvent("fadeInComplete");
			this.fadeMaskTimeout = null;
		}, (this.fadeMaskDuration * 1100) | 0);
	}

	cancelFade(){
		if(!this.fadeMaskTimeout){
			return; // Not currently fading; do nothing.
		}

		this.gainNode.gain.cancelScheduledValues(Sound.context.currentTime);
		this.gainNode.gain.value = 1;
		window.clearTimeout(this.fadeMaskTimeout);
		this.fadeMaskTimeout = null;
	}


}
