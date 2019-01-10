import Sound from "../Sound"
import Effect from "./Effect"

export default class BiquadFilter extends Effect {

	static _initialize(){
		// Filter types.
			BiquadFilter.HIGHPASS = "highpass";
			BiquadFilter.LOWPASS = "lowpass";
			BiquadFilter.BANDPASS = "bandpass";
			BiquadFilter.LOWSHELF = "lowshelf";
			BiquadFilter.HIGHSHELF = "highshelf";
			BiquadFilter.PEAKING = "peaking";
			BiquadFilter.NOTCH = "notch";
			BiquadFilter.ALLPASS = "allpass";
	}

	set type(val){
		this.filterNode.type = val;
	}

	get type(){
		return this.filterNode.type;
	}

	set Q(val){
		this.filterNode.Q.value = val;
	}

	get Q(){
		return this.filterNode.Q.value;
	}

	set frequency(val){
		this.filterNode.frequency.value = val;
	}

	get frequency(){
		return this.filterNode.frequency.value;
	}

	set gain(val){
		this.filterNode.gain.value = val;
	}

	get gain(){
		return this.filterNode.gain.value;
	}

	set detune(val){
		this.filterNode.detune.value = val;
	}

	get detune(){
		return this.filterNode.detune.value;
	}

	constructor(type = "lowpass", frequency = 1500, Q = 1, gain = 0, detune = 0){
		super();

		this.filterNode = Sound.context.createBiquadFilter();

		this.filterNode.type = type;
		this.frequency = frequency;
		this.Q = Q;
		this.gain = gain;
		this.detune = detune;

		this.effectBus.connect(this.filterNode);
		this.filterNode.connect(this.wetGainNode);
	}

	clone(){
		return new BiquadFilter(this.type, this.frequency, this.Q, this.gain, this.detune);
	}
}

BiquadFilter._initialize();
