import Sound from "../Sound";
import Effect from "./Effect"


export default class Reverb extends Effect {

	constructor(length = 1, buffer = null){
		super();

		this.length = length;


		//TODO: Should there be a buffer getter?
		this.reverbNode = Sound.context.createConvolver();
		if(!buffer){
			this._buffer = this.generateReverbSignal(this.length);
		}else{
			this.reverbNode.buffer = this._buffer = buffer;
		}


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

		return buffer;

	}

	clone(){
		return new Reverb(this.length, this._buffer);
	}

}
