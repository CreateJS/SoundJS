import Sound from "../Sound"

export default class Effect {

	set dryGain(val) {
		this.dryGainNode.gain.value = val;
	}

	get dryGain() {
		return this.dryGainNode.gain.value;
	}

	set wetGain(val){
		this.wetGainNode.gain.value = val;
	}

	get wetGain(){
		return this.wetGainNode.gain.value;
	}

	constructor(){

		// Set up the filter's internal audio graph here. At minimum, all filters need an input node and an output node
		// (though these can be the same node) for attaching and detaching.

		this.inputNode = Sound.context.createGain(); // The node external sources will connect to
		this.effectBus = Sound.context.createGain(); // The node that connects up to the effects chain.
		this.outputNode = Sound.context.createGain();// The node that will connect to external destinations
		this.dryGainNode = Sound.context.createGain();		// The amount of dry signal included in the output
		this.wetGainNode = Sound.context.createGain();   // The amount of wet signal included in the output

		this.inputNode.connect(this.effectBus);
		this.inputNode.connect(this.dryGainNode);

		this.wetGainNode.connect(this.outputNode);
		this.dryGainNode.connect(this.outputNode);

		this.dryGainNode.gain.value = 0;

		this._enabled = true;
		this.owner = null; // The Sample, Playback or Group that owns this effect - used for checking when adding an effect to prevent being added to multiple locations
	}

	/**
	 * Attaches this effect to a destination WebAudio node. This function should generally serve as a wrapper for the
	 * outputNode's connect, but gives a chance for an Effect to perform some setup when it's connected to a new node.
	 * @param destination
	 */
	connect(destination){
		if(destination && destination.inputNode){
			// This is another effect or similar, so connect up to the input node instead of trying to connect to it directly
			destination = destination.inputNode;
		}
		this.outputNode.connect(destination);
	}

	/**
	 * Disconnects this from its output. Like attach, this function is a wrapper for the outputnode's disconnect,
	 * and gives a chance for an Effect to perform any cleanup when it's disconnected.
	 */
	disconnect(destination){
		if(destination && destination.inputNode){
			// If this destination has an input node, that's what we want to disconnect from, rather than the object itself.
			destination = destination.inputNode;
		}
		this.outputNode.disconnect(destination);
	}

	disable(){
		if(!this._enabled){
			return; // do nothing, already disabled.
		}

		this.inputNode.disconnect(this.effectBus);
		this.inputNode.disconnect(this.dryGainNode);
		this.inputNode.connect(this.outputNode);
		this._enabled = false;
	}

	enable(){
		if(this._enabled){
			return // do nothing, already enabled.
		}

		this.inputNode.disconnect(this.outputNode);
		this.inputNode.connect(this.effectBus);
		this.inputNode.connect(this.dryGainNode);
		this._enabled = true;
	}
}
