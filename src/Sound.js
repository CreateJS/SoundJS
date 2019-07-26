import Group from "./Group";
import Sample from "./Sample";
import { EventDispatcher } from "@createjs/core";

class Sound {

	// Sets up all static class defaults. This function is immediately invoked below the Sound class definition to ensure it runs.
	static _initialize() {
		EventDispatcher.initialize(Sound);

		let soundContextClass = window.AudioContext || window.webkitAudioContext;
		Sound.__context = new soundContextClass();

		Sound.__rootGroup = new Group(null);
		Sound.__rootGroup.outputNode.connect(Sound.context.destination);

		Sound.__fileExtensionPriorityList = ["mp3"];
		Sound._strictFallbacks = true;
		Sound._idHash = {};
		Sound._arrayBufferIdSuffix = 0;
		Sound._audioBufferIdSuffix = 0;
		Sound._audioBuffers = {};

		Sound._unlockingEvents = ["click", "touchstart", "touchend", "mousedown", "mouseup"];

		Sound._unlockingEvents.forEach( (evtName) => {
			window.addEventListener(evtName, Sound.unlockAudio);
		});

		Sound.onunlock = null;

	}

	static unlockAudio(){
		if(Sound.context.state === "suspended"){
			let pr = Sound.context.resume();

			pr.then( () => {
				Sound.dispatchEvent("audioUnlocked");

				Sound._unlockingEvents.forEach( (evtName) => window.removeEventListener(evtName, Sound.unlockAudio));

				if(Sound.onunlock){
					Sound.onunlock();
				}
			}).catch( (reason) =>{
				console.log(`Resuming audio context failed with the following error:`);
				console.log(reason);
			});

			return pr;
		}else if(Sound.context.state === "running"){
			// Remove listeners.
			Sound._unlockingEvents.forEach( (evtName) => window.removeEventListener(evtName, Sound.unlockAudio));

			// TODO: should this call the audio unlock callback?
		}
	}

	// Read-only properties
	static get context() {
		return Sound.__context;
	}

	static get rootGroup() {
		return Sound.__rootGroup;
	}

	// Simple static properties
	static get strictFallbacks() {
		return Sound._strictFallbacks;
	}

	static set strictFallbacks(val) {
		Sound._strictFallbacks = val;
	}

	// More complex static properties

	static get fileExtensionPriorityList() {
		return Sound.__fileExtensionPriorityList;
	}

	static set fileExtensionPriorityList(newList) {
		let list = Sound.fileExtensionPriorityList;

		// Swap the array contents in place so external refs stay valid:
		list.splice(0, list.length);
		newList.forEach(item => list.push(item));
	}

	static get fallbackFileExtension() {
		// Look up the fallback file extension each time. Performance cost should be small (since sound loading should be gated by
		// the loading part), and the array of fallback file extensions may have changed without our knowledge.

		let testElement = document.createElement("audio");
		let bestMaybe = null;
		for (let i = 0; i < Sound.fileExtensionPriorityList.length; i++) {
			let extension = Sound.fileExtensionPriorityList[i];
			let result = testElement.canPlayType("audio/" + extension);

			switch (result) {
				case "probably":
					return extension; // Found a good one, return it
				case "maybe":
					if (!Sound.strictFallbacks) {
						return extension // Not in strict mode, 'maybe' is okay.
					} else if (bestMaybe === null) {
						bestMaybe = extension; // Haven't found a best maybe yet, store this one off in case we don't find a "probably".
					}
					break;
				case "":
				// this extension not supported, no-op
				default:
				// no-op
			}
		}

		// We didn't find anything, so return our best maybe, or null if we didn't even find one of those.
		return bestMaybe || null;
	}

	/**
	 * Register a sample for static access via Sound.playSound(id); If a source (e.g. a URL) is given instead of a sample, a sample will
	 * be created with that source. If no ID is given, the source of the sample will be used, if possible. If the ID is
	 * already in use, the sound will not be registered and this function will throw an error.
	 * @param sampleOrSource
	 * @param id
	 */
	static registerSound(sampleData, id, defaultPlayProps) {
		id = id || Sound._generateRegistrationId(sampleData);

		if (Sound._idHash[id]) {
			// Id is in use. Check for a match.
			if (Sound._idHash[id] === sampleData || Sound._idHash[id].src === sampleData) {		// Match logic: If a sample was provided, it must be exactly equal to the already registered sample.
																																												// If a source was provided, compare the source to the source of the existing sample, and if they match, the samples match.
																																												// Note that this will always fail for data URLs and array buffers, as these are too large and not stored in a sample's src.
				// Sound already exists, but if they registered with props, they probably expect those props:
				defaultPlayProps && Sound._idHash[id].consumePlayPropsObj(defaultPlayProps);
				return;
			}else{
				// Throw an error if there's a conflict.
				throw new Error(`Error registering sound with id "${id}" - id already in use.`)
			}
		}

		// No existing entry found, so create this sample (or use the existing one) and store for later use:
		let sample = (sampleData instanceof Sample) ? sampleData : new Sample(sampleData);
		sample.consumePlayPropsObj(defaultPlayProps);
		Sound._idHash[id] = sample;
	}

	/**
	 * Generates a usable id for registering a sound under, in the case the user didn't provide one. Will use a provided
	 * source as an ID, or uses the Sample's source if a sample was provided.
	 * @param sampleOrSource The source or sample to generate an ID for.
	 * @returns {*}
	 * @private
	 */
	static _generateRegistrationId(sampleOrSource) {
		return (sampleOrSource instanceof Sample) ? sampleOrSource.src : sampleOrSource;
	}

	/**
	 * Removes a sample previously registered for static tracking, either by Sound.play or Sound.registerSound. For the removal
	 * of a single sample, use sample.destroy. To remove all samples with a given url source, use Sound.purgeSamples
	 * @param id
	 */
	static removeSound(id) {
		const hashId = (id instanceof Object && id.id) ? id.id : id;

		// TODO: basepath?

		let sample = Sound._idHash[hashId];
		if (sample) {
			delete Sound._idHash[hashId];
			sample.destroy();
		} else {
			throw new Error("Could not remove sample - sample not found.")
		}
	}

	/**
	 * Play a sound - either a previously registered one, or, if not found, assume the "id" is a source and attempt to
	 * make a sample and play it.
	 * @param idOrSrc The identifier of the sound to play.
	 * @param playProps Optional. The properties to apply to the sound.
	 */
	static play(idOrSrc, playProps) {
		let registered = Sound._idHash[idOrSrc]; // Will this cause problems with people trying to make a new sample?
		if (registered) {
			registered.play(playProps);
			return registered;
		} else {
			// ID not found. Assume it is a source.
			let sample = new Sample(idOrSrc);
			Sound.registerSound(sample, idOrSrc);
			sample.play(playProps);
			return sample;
		}
	}

	/**
	 * Stops ALL sounds that SoundJS is playing.
	 */
	static stop(){
		Sound.rootGroup.stop();
	}

	static isExtensionSupported(pathOrExtension, strict = true) {
		// The file extension is assumed to be either "everything after the last '.' character", or, if there is no ., the whole string.
		let match = /\.(\w+)$/.exec(pathOrExtension);
		let ext = match ? match[1] : pathOrExtension;
		let result = document.createElement("audio").canPlayType("audio/" + ext);
		//return result !== "";
		return strict ? result === "probably" : result !== "";
	}

	static purgeSamples(urlOrId) {
		// TODO: Implement. Intention: search the group tree for all samples with a matching URL or ID and destroy them.

		let samples = null;
		if(urlOrId === "" || urlOrId === undefined){
			samples = Sound.rootGroup._getAllSampleDescendants();
		}else{
			samples = Sound.rootGroup._getSampleDescendantsBySource(urlOrId)
		}

		if(Sound._idHash[urlOrId]){
			Sound.removeSound(urlOrId);
		}

		samples.forEach(  s => s.destroy()  );

	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// GROUP PARITY:
	// These functions make the root static Sound object 'grouplike' - you can interact with it like it were a group and
	// it will affect all sounds in SoundJS's group tree.

	/*static get samples(){
    	return this.rootGroup.samples;
	}

	static get groups(){
    	return this.rootGroup.subgroups;
	}*/

	static pause() {
		this.rootGroup.pause();
	}

	static resume() {
		this.rootGroup.resume();
	}

	static add(sampleOrGroup) {
		this.rootGroup.add(sampleOrGroup);
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// SOUNDJS 1 PARITY:
	// These functions are mostly passthroughs to new implementations, and exist to allow some backwards compatability
	// with soundJS 1.


	/*static createInstance(src, offset, playDuration) {
		return new Sample(src, {offset: offset, playDuration: playDuration});
	}

	static getDefaultPlayProps(sampleOrId) {
		// TODO: implement. Search IDs and active samples for one that matches the src, and get the default play props of that sound.

		let sample = sampleOrId instanceof Sample ? sampleOrId : Sound._idHash[sampleOrId];

		if(sample){
			return sample.makePlayPropsObj();
		}else{
			// TODO: Revisit this, like with setDefaultPlayProps
			return null;
		}
	}

	static setDefaultPlayProps(sampleOrId, props) {
		if(sampleOrSrcOrId instanceof Sample){
			sampleOrSrcOrId.consumePlayPropsObj(props);
		}else if(Sound.rootGroup[sampleOrSrcOrId]){
			Sound.rootGroup[sampleOrSrcOrId].consumePlayPropsObj(props);
		}else{
			// TODO: Revisit this behaviour
			throw new Error(`Couldn't set default play props on ${sampleOrId}: object is neither a sample nor an ID of a statically stored sound.` )
		}

	}*/

	static getSampleBySrc(src){
		let list = Sound.getSamplesBySrc(src);
		if(list){
			return list[0];
		}else{
			return null;
		}
	}

	static getSamplesBySrc(src){
		return this.rootGroup._getSampleDescendantsBySource(src);
	}


	/**
	 * Register multiple sounds at once. TODO: expected args?
	 * @param sounds
	 */
	static registerSounds(sounds) {
		sounds.forEach( s => Sound.registerSound(s, s.id) );
	}

	/**
	 * Remove multiple sounds registered by either Sound.play or Sound.registerSound. Takes the same type of argument as
	 * removeSound (aka an ID), but as an array, for multiple removals at once.
	 * @param sounds
	 */
	static removeSounds(sounds) {
		sounds.forEach( s => Sound.removeSound(s)  );
	}

	static removeAllSounds() {
		Sound.purgeSamples();
	}


	/********************
	 * TODO: This requestBuffer function is the last thing I was working on, and it's very unfinished and untested. There's
	 * also duplicates of this code in Sample that will be defunct if/when this works.
	 *
	 * Possible improvement planned: For Data URLs, don't store the Data URL as a string, just decode the buffer each time
	 * and compare against that e.g. as if you had been provided an audio buffer
	 *
	 * This should also be chopped up into separate functions when it's confirmed working to clean up some of this mess
	 */

	static requestBuffer(data, sample){

		// ID reservation must be synchronous - other requests may be made for the same buffer before the promise resolves,
		// even if the audio is already loaded.
		let id = Sound._reserveId(data);

		if(!id){
			return null; // Will likely cause errors as functions calling this will be expecting a promise,
										// but we're already in an error state if the reserved id was null. May improve later.
		}

		if(Sound._audioBuffers[id] instanceof Promise){
			// This buffer has already been requested. Return that promise.
			console.log("Already loading - we have a promise. returning");
			return Sound._audioBuffers[id];
		}

		if(Sound._audioBuffers[id] instanceof AudioBuffer){
			console.log("buffer already exists - returning");
			return new Promise( (resolve, reject) => { resolve({audioBuffer: Sound._audioBuffers[id], bufferId: id}); } );
		}

		// We have an ID, but we don't already have a pending promise for the buffer, so kick off the load/decode:

		let pr = new Promise( (resolve, reject) => {

			if(Sound._audioBuffers[id] instanceof AudioBuffer){
				// We already have this buffer. Resolve immediately:
				console.log("AudioBuffer already in list");
				resolve({audioBuffer: Sound._audioBuffers[id], bufferId: id});  // incorrect
				return;
			}

			// Don't have this buffer yet - load and decode, then store it off for future use and resolve:

			if(data instanceof ArrayBuffer){
				Sound._fetchByArrayBuffer(data, id, resolve, reject);
				console.log("Fetching by array buffer");

			}else if(data instanceof AudioBuffer){
				Sound._fetchByAudioBuffer(data, id, resolve, reject);
				console.log("Fetching by audio buffer");

			} else if (typeof data === "string") {
				Sound._fetchByString(data, id, resolve, reject);
				console.log("Fetching by string");

			} else if (data instanceof Array) {
				Sound._fetchByUrlArray(data, id, resolve, reject);
				console.log("Fetching by url array");

			} else if (data && data.src) {
				Sound._fetchByString(data.src, id, resolve, reject);
				console.log("Fetching by string");

			} else if (typeof data === "object") {
				Sound._fetchByUrlHash(data, id, resolve, reject);
				console.log("Fetching by url hash");

			}
		});

		// Now store off the promise so that other people requesting the same buffer get the same promise, and return

		if(!(Sound._audioBuffers[id] instanceof AudioBuffer)){
			// Need to check if the AudioBuffer already is in place. The above promise may resolve synchronously sometimes,
			// so it may have already placed an already-loaded AudioBuffer into the top level hash.
			console.log("storing promise");
			Sound._audioBuffers[id] = pr;
		}
		return pr;
	}

	static _reserveId(data){
		if(data instanceof ArrayBuffer){
			data.soundJsId = data.soundJsId || "ab_" + Sound._arrayBufferIdSuffix++;
			return data.soundJsId;

		}else if(data instanceof AudioBuffer){
			data.soundJsId = data.soundJsId || "audioBuffer_" + Sound._audioBufferIdSuffix++;
			return data.soundJsId;

		} else if (typeof data === "string") {
			return data;

		} else if (data instanceof Array) {
			return this._reserveIdFromUrlArray(data);

		} else if (data && data.src) {
			return data.src;

		} else if (typeof data === "object") {
			return this._reserveIdFromUrlHash(data);

		}
	};

	static _reserveIdFromUrlArray(arr){
		for (let i = 0; i < arr.length; i++) {
			let url = arr[i];
			if (Sound.isExtensionSupported(url, false)) {
				return url;
			}
		}
		console.warn("Warning: Attempted to create an audiobuffer from a url array, but didn't find any supported file types. Requested urls were:");
		console.log(arr);
		return null;
	}

	static _reserveIdFromUrlHash(o){
		// Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
		for (let ext in o) {
			if ( o.hasOwnProperty(ext) && Sound.isExtensionSupported(ext, false) ) {
				return o[ext];
			}
		}
		console.error("Warning: Attempted to create an audiobuffer from a url hash, but didn't find any supported file types. Requested urls were:");
		console.log(o);
		return null;
	}

	static _fetchByArrayBuffer(buffer, id, resolve, reject){
		Sound.decodeArrayBuffer(buffer).then( (audioBuffer) => {
			Sound._audioBuffers[id] = audioBuffer;
			resolve({audioBuffer: audioBuffer, bufferId: id});
		});
	}

	static _fetchByAudioBuffer( buffer, id, resolve, reject){
		Sound._audioBuffers[id] = buffer;
		resolve({audioBuffer: buffer, bufferId: id});
	}

	static _fetchByString(data, id, resolve, reject){
		console.log("found string url");

		let ab = Sound._audioBuffers[id];

		if(ab){
			resolve({audioBuffer: ab, bufferId: id}); // TODO: this check is duplicated in the individual cases, so remove at least one
			return;
		}

		// Buffer not found. Load and decode.
		if (/^data:.*?,/.test(data)) { // Test for Data URL
			console.log("found data url");
			let ab = Sound._audioBuffers[id];
			if(ab instanceof AudioBuffer){
				resolve({audioBuffer: ab, bufferId: data});// TODO: Improve so we're not storing data URLs on Samples.
			}else{
				// Data URLs can just be loaded by XHR, so do so
				Sound.loadAndDecodeAudio(data).then( (audioBuffer) => {
					Sound._audioBuffers[id] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: data})} ); // TODO: Improve so we're not storing data URLs on Samples.
			}

		} else {
			// Assumed to be a regular url at this point
			let src = Sound.ensureValidFileExtension(data);
			console.log("found regular string url");
			// Checks to see if we might have stored a buffer with this URL (after possibly changing the file extension):
			let ab = Sound._audioBuffers[src];
			if(ab instanceof AudioBuffer){
				resolve({audioBuffer: ab, bufferId: src})
			}else{
				Sound.loadAndDecodeAudio(src).then ( (audioBuffer) => {
					Sound._audioBuffers[id] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: id})
				});
			}
		}
	}

	static _fetchByUrlArray(arr, id, resolve, reject){
		let ab = Sound._audioBuffers[id];
		if(ab instanceof AudioBuffer) {
			resolve({audioBuffer: ab, bufferId: id});
		}

		for (let i = 0; i < arr.length; i++) {
			let url = arr[i];
			if (!Sound.isExtensionSupported(url, false)) {
				continue;
			}
			let ab = Sound._audioBuffers[id];
			if(ab instanceof AudioBuffer){
				resolve({audioBuffer: ab, bufferId: id});
			}else{
				Sound.loadAndDecodeAudio(url).then ( (audioBuffer) => {
					Sound._audioBuffers[id] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: id})
				});
			}

			return; // We found the first (and thus highest priority) workable extension, and don't need to keep looking
		}
		reject("No supported files types found in URL array");
	}

	static _fetchByUrlHash(hash, id, resolve, reject){
		// Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
		for (let ext in hash) {
			if (!hash.hasOwnProperty(ext) || !Sound.isExtensionSupported(ext, false) ) {
				continue;
			}
			//this.src = src[ext];
			let ab = Sound._audioBuffers[id]; // TODO cleanup, move out of loop
			if(ab instanceof AudioBuffer){
				resolve({audioBuffer: ab, bufferId: hash[ext]});
			}else{
				Sound.loadAndDecodeAudio(hash[ext]).then ( (audioBuffer) => {
					Sound._audioBuffers[id] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: id})
				});
			}
			break; // We only need one valid url
		}
		reject("No supported files types found in URL hash");
	}

	static loadAndDecodeAudio(src){
		return new Promise( (resolve, reject) => {
			Sound.loadAudio(src).then( (arrayBuffer) => {
				Sound.decodeArrayBuffer(arrayBuffer).then ( (audioBuffer) => resolve(audioBuffer))
			})
		});
	}

	static loadAudio(src){
		return new Promise( (resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open('GET', src, true);
			request.responseType = 'arraybuffer';
			request.onload = (loadEvent) => {
				let xhr = loadEvent.target;
				if(xhr.readyState === 4 && xhr.status === 200){
					let result = xhr.response;
					resolve(result);
				}else{
					reject(loadEvent);
				}
			};

			request.send();
		});
	}

	static decodeArrayBuffer(arrayBuffer){
		return new Promise( (resolve, reject) => {
			Sound.context.decodeAudioData(arrayBuffer,
				(result) => { // Success
					resolve(result);
				}
				,
				(error) => { // Error
					reject(error);
				});
		});
	}

	static ensureValidFileExtension(url) {
		// Not a data URL, so let's doublecheck the file extension before loading.
		let extensionExp = /\.\w+$/;
		let result = extensionExp.exec(url);
		if (result === null) {
			// No file extension, so add one
			url = url.concat("." + Sound.fallbackFileExtension);
		} else {
			// Found a file extension. Check if it's supported. If it's definitely not, fall back.
			let extension = result[0].substr(1);
			if (!Sound.isExtensionSupported(extension, false)) {
				url = url.replace(extensionExp, "." + Sound.fallbackFileExtension);
			}
		}
		return url;
	}

/*
	handleAudioLoaded(loadEvent) {
		let xhr = loadEvent.target;
		if(xhr.readyState === 4 && xhr.status === 200){
			let ctx = Sound.context;
			let result = loadEvent.target.response;
			ctx.decodeAudioData(result, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
		}
	}

	handleAudioDecoded(buffer) {
		this.audioBuffer = buffer;

		this.dispatchEvent("ready");

		if (this._playbackRequested) {
			this._play(this._requestedPlaybackPlayprops);
		}
	}

	handleAudioDecodeError(e) {
		console.warn("Error decoding audio data in Sample.")
	}*/

	static releaseBuffer(id, sample){

	}
}

Sound._initialize();

export default Sound;
