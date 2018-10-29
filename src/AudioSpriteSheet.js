import EventDispatcher from "@createjs/core/src/events/EventDispatcher";
import Sound from "./Sound";
import Sample from "./Sample";


export default class AudioSpriteSheet{

	constructor(src, ...sprites) {
		console.log(src);
		console.log(sprites);

		this._sprites = {}; // contains the data defining each audio sprite. E.g. "{"bark": {start: 300, end: 1400}};
		this.buffer = null;

		this.src = src; // This will be overwritten with the bufferId when the buffer request finishes, but until that promise
		// resolves, this src can be used to create samples instead. The buffer request system will handle it.
		Sound.requestBuffer(src).then((result) => {
			this.src = result.bufferId;
			this.handleBufferReceived(result.audioBuffer);
		});

		if (sprites.length === 1) {
			if (sprites[0] instanceof Array) {
				// Handle array
				let arr = sprites[0];
				arr.forEach( (spr) => {console.log(spr); this.makeSprite(spr)} );

			} else if(sprites[0].id) {
				// Handle single sprite
				console.log(`Single sprite found: ${sprites[0]}`);
				this.makeSprite(sprites[0]);
			} else {
				// Handle object
				for (let spr in sprites[0]) {
					console.log(spr);
					this.makeSprite(spr);
				}
			}
		}else if (sprites.length > 1){
			// Handle multiple sprite args
			sprites.forEach( (spr) => {console.log(spr); this.makeSprite(spr) });
		}
	}

	handleBufferReceived(audioBuffer){
		this.buffer = audioBuffer;
	}

	makeSprite(id, start, duration){
		if(typeof id === "object"){
			// A full sprite was provided. separate into parts.
			duration = id.duration || id.playDuration;
			start = id.start || id.startTime;
			id = id.id;
		}

		if(typeof id !== "string"){
			console.log("Error: Attempted to make a sprite from an AudioSpriteSheet with an invalid ID parameter. A string ID is required.");
		}

		let o = {start: start, duration: duration};

		let smp = new Sample(this.src, {offset: start, playDuration: duration});
		Sound.registerSound(smp, id);
		o.sample = smp;

		this._sprites[id] = o;

		return smp;
	}

	makeSprites(spriteArray){
		spriteArray.forEach( (spr) => this.makeSprite(spr) );
	}

	getSprite(id){
		let spr = this._sprites[id];
		if(!spr){
			return undefined;
		}else{
			return this._sprites[id].sample;
		}
	}

	getSpriteData(id){
		return this._sprites[id];
	}

	play(id){
		let spr = this._sprites[id];
		if(!spr){
			console.error(`Audio Sprite Sheet could not play sound with id ${id} - no registered sprite with that ID was found.`);
		}
		let smp = this._sprites[id].sample;

		if(smp){
			smp.play();
			return smp;
		}
	}
}
