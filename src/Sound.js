import Group from "./Group";
import Sample from "./Sample";
import EventDispatcher from "@createjs/core/src/events/EventDispatcher";

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
		// TODO: basepath?
		let sample = Sound._idHash[id];
		if (sample) {
			delete Sound._idHash[id];
			sample.destroy();
		}else{
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
		sounds.forEach( s => Sound.registerSound(s) )
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
		return new Promise( (resolve, reject) => {
			if(data instanceof ArrayBuffer){
				Sound._fetchByArrayBuffer(data, resolve, reject);

			}else if(data instanceof AudioBuffer){
				Sound._fetchByAudioBuffer(data, resolve, reject);

			}else if (typeof data === "string"){
				Sound._fetchByString(data, resolve, reject);

			} else if (data instanceof Array) {
				Sound._fetchByUrlArray(data, resolve, reject);

			} else if (typeof data === "object") {
				Sound._fetchByUrlHash(data, resolve, reject);

			}
		});
	}

	static _fetchByArrayBuffer(buffer, resolve, reject){
		if(buffer.soundJsId){
			console.log("buffer found");
			resolve(Sound._audioBuffers[data.soundJsId]);
		}else{
			Sound.decodeArrayBuffer(data).then(
				(audioBuffer) => {
					buffer.soundJsId = "ab_" + Sound._arrayBufferIdSuffix++;
					Sound._audioBuffers[buffer.soundJsId] = audioBuffer;
					window.ab = buffer;
					resolve({audioBuffer: audioBuffer, bufferId: data.soundJsId});
				});
		}
	}

	static _fetchByAudioBuffer(buffer, resolve, reject){
		// Check to see if we already have it.
		for(let id in Sound._audioBuffers){
			if(data === Sound._audioBuffers[id]){ // Checks memory addresses, rather than compares arrays, so this is fast
				console.log("Request buffer: existing audio buffer found by mem address match");
				resolve({audioBuffer: data, bufferId: id});
				return;
			}
		}

		// Didn't find an identical memory address, so let's check the actual data for a match.
		let audioBufferCompare = (a, b) => {
			if(a.length !== b.length){ return false; } // Length check saves expensive by-element comparison in most cases.
			for(let i = 0; i < a.length; i++){
				if(a[i] !== b[i]){ return false; }
			}
			return true;
		};

		for(let id in Sound._audioBuffers){
			let buf = Sound._audioBuffers[id];

			if(audioBufferCompare(buf, data)){
				// Found an identical buffer, so just use it.
				console.log("request buffer: existing audio buffer found by direct data comparison.");
				resolve({audioBuffer: Sound._audioBuffers[id], bufferId: id});
				return;
			}
		}

		//If we reach here, it means no identical buffer was found, so this is new and we should store it.
		console.log("Storing new audio buffer");

		let id = "audioBuffer_" + Sound._audioBufferIdSuffix++;
		Sound._audioBuffers[id] = data;
		resolve({audioBuffer: data, bufferId: id});
	}

	static _fetchByString(data, resolve, reject){
		console.log("found string url");

		let ab = this._audioBuffers[data];

		if(ab){
			resolve({audioBuffer: ab, bufferId: data}); // TODO: this check is duplicated in the individual cases, so remove at least one
			return;
		}

		// Buffer not found. Load and decode.
		if (/^data:.*?,/.test(data)) { // Test for Data URL
			console.log("found data url");
			let ab = Sound._audioBuffers[data];
			if(ab){
				resolve({audioBuffer: ab, bufferId: data});// TODO: Improve so we're not storing data URLs on Samples.
			}else{
				// Data URLs can just be loaded by XHR, so do so
				Sound.loadAndDecodeAudio(data).then( (audioBuffer) => {
					Sound._audioBuffers[data] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: data})} ); // TODO: Improve so we're not storing data URLs on Samples.
			}

		} else {
			// Assumed to be a regular url at this point
			/*this.src = */ let src = Sound.ensureValidFileExtension(data);
			console.log("found regular string url");
			let ab = Sound._audioBuffers[src];
			if(ab){
				resolve({audioBuffer: ab, bufferId: src})
			}else{
				Sound.loadAndDecodeAudio(src).then ( (audioBuffer) => {
					Sound._audioBuffers[data] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: data})
				});
			}

		}
	}

	static _fetchByUrlArray(arr, resolve, reject){
		for (let i = 0; i < src.length; i++) {
			let url = arr[i];
			if (!Sound.isExtensionSupported(url, false)) {
				continue;
			}
			let ab = Sound._audioBuffers[url];
			if(ab){
				resolve({audioBuffer: ab, bufferId: url});
			}else{
				Sound.loadAndDecodeAudio(url).then ( (audioBuffer) => {
					Sound._audioBuffers[url] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: url})
				});
			}

			break; // We found the first (and thus highest priority) workable extension, and don't need to keep looking
		}
		reject("No supported files types found in URL array");
	}

	static _fetchByUrlHash(hash, resolve, reject){
		// Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
		for (let ext in data) {
			if (!data.hasOwnProperty(ext) || !Sound.isExtensionSupported(ext, false) ) {
				continue;
			}
			//this.src = src[ext];
			let ab = Sound._audioBuffers[data[ext]];
			if(ab){
				resolve({audioBuffer: ab, bufferId: data[ext]});
			}else{
				Sound.loadAndDecodeAudio(data[ext]).then ( (audioBuffer) => {
					Sound._audioBuffers[data[ext]] = audioBuffer;
					resolve({audioBuffer: audioBuffer, bufferId: data[ext]})
				});
			}
			break; // We only need one valid url
		}
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


	static releaseBuffer(id, sample){

	}
}

Sound._initialize();

export default Sound;
