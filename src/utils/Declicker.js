import { EventDispatcher } from "@createjs/core";
import Sound from "../Sound";

export default class Declicker extends EventDispatcher {

	get isFadingIn(){
		return this.isFading && this._fadingIn === true;
	}

	get isFadingOut(){
		return this.isFading && this._fadingIn === false;
	}

	get isFading(){
		return !!this.fadeMaskTimeout;
	}

	constructor(gainNode){
		super();

		// The node we will use for fading to prevent clicks. Use provided node if exists, otherwise create one.
		this.gainNode = this.inputNode = this.outputNode = gainNode || Sound.context.createGain();

		this.fadeMaskDuration = 0.02; // Duration of the fade, in seconds.
		this.fadeMaskTimeout = null;  // Reference to the timeout for calling an event, to allow cancelling
		this._fadingIn = null;
	}

	fadeOut(){
		if(this.fadeMaskTimeout){
			return; // Do nothing if we're already fading.
		}
		this.gainNode.gain.value = 1;
		this.gainNode.gain.linearRampToValueAtTime(0, Sound.context.currentTime + this.fadeMaskDuration);
		this._fadingIn = false;

		this.fadeMaskTimeout = window.setTimeout( () => {
			this.dispatchEvent("fadeOutComplete");
			this.fadeMaskTimeout = null;
			this._fadingIn = null;
		}, (this.fadeMaskDuration * 1100) | 0);

	}

	fadeIn(){
		if(this.fadeMaskTimeout){
			return; // Do nothing if we're already fading.
		}

		this.gainNode.gain.value = 0;
		this.gainNode.gain.linearRampToValueAtTime(1, Sound.context.currentTime + this.fadeMaskDuration);
		this._fadingIn = true;

		this.fadeMaskTimeout = window.setTimeout( () => {
			this.dispatchEvent("fadeInComplete");
			this.fadeMaskTimeout = null;
			this._fadingIn = null;
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
		this._fadingIn = null;
	}


}
