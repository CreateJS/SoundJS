import Sound from "../Sound";
import Effect from "./Effect"


export default class Reverb extends Effect {

	constructor(length = 1){
		super();

		this.reverbNode = Sound.context.createConvolver();
		this.reverbNode.buffer = this.generateReverbSignal(length);

		this.effectBus.connect(this.reverbNode);
		this.reverbNode.connect(this.wetGainNode);
	}

	generateReverbSignal(length){
		let bufferLength = length * createjs.Sound.context.sampleRate;
		let numChannels = 1;
		let buffer = createjs.Sound.context.createBuffer(numChannels, bufferLength, createjs.Sound.context.sampleRate );

		let bufferData = buffer.getChannelData(0);
		for(let i = 0; i < bufferData.length; i++){
			bufferData[i] = (Math.random() * 2 - 1) * Math.pow((1 - (i/bufferData.length)),3);
		}

		this.buffer = buffer;
		return buffer;

	}

}
