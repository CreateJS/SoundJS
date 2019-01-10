import Sound from "../Sound"
import Effect from "./Effect"
import HighPassFilter from "./HighPassFilter";

export default class Analyser extends Effect {

	constructor(binCount = 4){
		super();

		this.analyserNode = Sound.context.createAnalyser();

		this.effectBus.connect(this.analyserNode);
		this.analyserNode.connect(this.wetGainNode);
	}

	// Outputs what is essentially a bar graph of how much each frequency is included in the current audio signal.
	getFrequencyData(storageArray){
		if(!storageArray){
			storageArray = new Float32Array(this.analyserNode.frequencyBinCount); // This will allow people to pass the same array to save on space and copying, but it's not necessary if they just want to check once.
		}
		return this.analyserNode.getFloatTimeDomainData(storageArray);
	}

	// Outputs what is essentially a snapshot of the waveform of the audio signal at this instant.
	getTimeDomainData(storageArray){
		if(!storageArray){
			storageArray = new Float32Array(this.analyserNode.frequencyBinCount); // This will allow people to pass the same array to save on space and copying, but it's not necessary if they just want to check once.
		}
		return this.analyserNode.getFloatFrequencyData(storageArray);
	}

	clone(){
		return new Analyser();
	}
}
