import { EventDispatcher } from "@createjs/core";
import Sound from "./Sound";
import Declicker from "./utils/Declicker"


export default class AbstractAudioWrapper extends EventDispatcher{
	set volume(val) {
		this.volumeNode.gain.value = val;
	}

	get volume() {
		return this.volumeNode.gain.value;
	}

	set pan(val) {
		this.panNode.setPosition(val, 0, 0.5);
	}

	get pan() {
		return this.panNode.positionX;
	}

	set muted(val){
		if(val){
			this.mute();
		}else{
			this.unmute();
		}
	}

	get muted(){
		return this._muted || this._muting;
	}

	constructor(){
		super();
		let ctx = Sound.context;

		this.fxBus = ctx.createGain();

		this.panNode = this.postFxNode = ctx.createPanner();

		this.declickerNode = ctx.createGain();
		this.declicker = new Declicker(this.declickerNode);
		this.declicker.on("fadeOutComplete", this.handleDeclickFadeoutComplete, this);

		this.muterNode = ctx.createGain();
		this._muted = false;
		this._muting = false;

		this.outputNode = this.volumeNode = ctx.createGain();

		this.fxBus.connect(this.postFxNode); // No effects to start
		this.postFxNode.connect(this.declickerNode);
		this.declickerNode.connect(this.muterNode);
		this.muterNode.connect(this.outputNode);

		this._effects = [];
		this.muted = false;
	}

	mute(){
		if(this._muted){
			return;
		}
		this.declicker.fadeOut();
		this._muting = true;
	}

	_muteCore(){
		this._muted = true;
		this._muting = false;
		this.muterNode.gain.value = 0;
	}

	unmute(){
		if(this._muting){
			this.declicker.cancelFade();
			this._muting = false;
		}else if(!this._muted){
			// Not muted or muting, do nothing.
			return;
		}

		// TODO: If relevant, check to see if any other declick fades are happening. At time of writing, there are no
		// other causes for a declick in the abstract audio wrapper, but subclasses that use the declicker might need to
		// prevent an unmute from controlling the declicker depending on state.
		this._muted = false;
		this.muterNode.gain.value = 1;
		this.declicker.fadeIn();
	}

	handleDeclickFadeoutComplete(e){
		if(this._muting){
			this._muteCore();
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Effects

	addEffect(effect){
		this.effects = this._effects.concat([effect]);
	}

	getEffects(){
		return this._effects;
	}

	cloneEffects(){
		// TODO: implement.
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
