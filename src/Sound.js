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
	}

	// Read-only properties
	static get context() {
		return Sound.__context;
	}

	static get _rootGroup() {
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
				// Silently do nothing if the samples match...
				
			}else{
				// ... or throw an error if there's a conflict.
				throw new Error("Error registering sound - ID already in use.")
			}

			return;
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
		Sound._rootGroup.stop();
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
			samples = Sound._rootGroup._getAllSampleDescendants();
		}else{
			samples = Sound._rootGroup._getSampleDescendantsBySource(urlOrId)
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
    	return this._rootGroup.samples;
	}

	static get groups(){
    	return this._rootGroup.subgroups;
	}*/

	static pause() {
		this._rootGroup.pause();
	}

	static resume() {
		this._rootGroup.resume();
	}

	static add(sampleOrGroup) {
		this._rootGroup.add(sampleOrGroup);
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
		}else if(Sound._rootGroup[sampleOrSrcOrId]){
			Sound._rootGroup[sampleOrSrcOrId].consumePlayPropsObj(props);
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
		return this._rootGroup._getSampleDescendantsBySource(src);
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
}

Sound._initialize();

export default Sound;
