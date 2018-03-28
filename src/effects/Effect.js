import Sound from "../Sound"

export default class Effect {
	constructor(){

		// Set up the filter's internal audio graph here. At minimum, all filters need an input node and an output node
		// (though these can be the same node) for attaching and detaching.

		this.inputNode = Sound.context.createGain();
		this.outputNode = Sound.context.createGain();
		this.firstEffectNode = null; // If this is set to the first node in the effect chain, the enable and disable functions will work.
		this._enabled = true;
	}

	/**
	 * Attaches this effect to a destination WebAudio node. This function should generally serve as a wrapper for the
	 * outputNode's connect, but gives a chance for an Effect to perform some setup when it's connected to a new node.
	 * @param destination
	 */
	attach(destination){
		this.outputNode.connect(destination);
	}

	/**
	 * Disconnects this from its output. Like attach, this function is a wrapper for the outputnode's disconnect,
	 * and gives a chance for an Effect to perform any cleanup when it's disconnected.
	 */
	detach(){
		this.outputNode.disconnect();
	}

	disable(){
		if(!this.firstEffectNode){
			console.warn("Warning - an Effect without a tracked firstEffectNode is being disabled. This will work, but it can't be enabled again.")
		}
		if(!this._enabled){
			return; // do nothing, already disabled.
		}

	}

	enable(){
		if(this._enabled){
			return // do nothing, already enabled.
		}
	}

}
