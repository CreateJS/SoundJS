/*
* SoundJS by Grant Skinner. May 25, 2011
* Visit http://www.gskinner.com/ for documentation, updates and examples.
*
*
* Copyright (c) 2011 Grant Skinner
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
* SoundJS is a utility for managing HTML5 audio elements.
* The SoundJS class uses a static API and can't be instantiated directly.
* @module SoundJS
* 
*/
(function(window) {
	
	/**
	 * @class SoundJS
	 * @static
	 */
	function SoundJS() {
		throw "SoundJS cannot be instantiated"; 
	}
	
	/**
	 * The duration in milliseconds to wait before declaring a timeout when loading a sound.
	 * 
	 * @property AUDIO_TIMEOUT
	 *  
	 * @static
	 * @default 8000
	 * @type Number
	 */
	SoundJS.AUDIO_TIMEOUT = 8000;
	
	/**
	 * The interrupt mode to use when all instances are in use. Interrupt the the first instance.
	 * 
	 * @property INTERRUPT_ANY
	 * 
	 * @static
	 * @default 1
	 * @type Number
	 * 
	 */
	SoundJS.INTERRUPT_ANY = 1;
	
	/**
	 * The interrupt mode to use when all instances are in use. Interrupt the sound that is at the earliest position.
	 * 
	 * @property INTERRUPT_EARLY
	 *
	 * @static
	 * @default 2
	 * @type Number
	 */
	SoundJS.INTERRUPT_EARLY = 2;
	
	/**
	 * The interrupt mode to use when all instances are in use. Interrupt the sound that is at the latest position.
	 *  
	 * @property INTERRUPT_LATE
	 * 
	 * @static
	 * @default 3
	 * @type Number
	 * 
	 */
	SoundJS.INTERRUPT_LATE = 3;
	
	/**
	 * The interrupt mode to use when all instances are in use. Do not interrupt any sounds.
	 * 
	 * @property INTERRUPT_NONE
	 * 
	 * @static
	 * @default 4
	 * @type Number
	 */
	SoundJS.INTERRUPT_NONE = 4;
	
	/**
	 * The function to call whenever progress changes.
	 * 
	 * @static
	 * @type Function
	 */
	SoundJS.onProgress = null;
	
	/**
	 * The function to call when a loading sound times out. The timeout duration is determined by the AUDIO_TIMEOUT parameter.
	 * 
	 * @static 
	 * @type Function
	 */
	SoundJS.onSoundTimeout = null;
	
	/**
	 * The function to call when an error occurs loading a sound file.
	 * 
	 * @static
	 * @type Function
	 */
	SoundJS.onSoundLoadError = null;
	
	/**
	 * The function to call when a sound has finished loading.
	 * 
	 * @static
	 * @type Function
	 */
	SoundJS.onSoundLoadComplete = null;
	
	/**
	 * The function to call when all sounds in the preload queue have finished loading.
	 * 
	 * @static
	 * @type Function
	 */
	SoundJS.onLoadQueueComplete = null;
	
	/**
	 * The function to call when a sound finishes playing.
	 *
	 * @static
	 * @type Function
	 */
	SoundJS.onSoundComplete = null;
	
	
	/**
	 * An array containing all of the sound objects created by this manager.
	 * 
	 * @property soundHash
	 * @type Array
	 * @protected
	 *
	 */
	SoundJS.soundHash = [];
	
	/**
	 * An array containing all of the sounds waiting to be loaded.
	 * 
	 * @property loadQueue
	 * @type Array
	 * @protected
	 * 
	 */
	SoundJS.loadQueue = [];
	
	/**
	 * The number of items left in loading queue.
	 * 
	 * @property itemsToLoad
	 * @type Number
	 * @private
	 * 
	 */
	SoundJS.itemsToLoad = 0;
	
	/**
	 * The number of currently playing instances.
	 * 
	 * @property instanceCount
	 * @type Number
	 * @private
	 * 
	 */
	SoundJS.instanceCount = 0;
	
	/**
	 * The assumed maximum number of sounds, based on some of the browser limits we have encountered. Currently, this can not be determined via code or APIs.
	 * 
	 * @private
	 * @static
	 * 
	 */
	SoundJS.INST_MAX = 35;
	
	/**
	 * Float error tolerance.
	 * 
	 * @private
	 * 
	 */
	SoundJS.FT = 0.001;
	
	/**
	 * The name of the JavaScript event dispatched by an audio tag when an error occurs.
	 * 
	 * @private
	 * 
	 */
	SoundJS.AUDIO_ERROR = "error";
	
	/**
	 * The name of the JavaScript event dispatched by an audio tag when loading progress changes.
	 * 
	 * @private
	 * 
	 */
	SoundJS.AUDIO_PROGRESS = "progress";
	
	/**
	 * The name of the JavaScript event dispatched by an audio tag when an a sound has finished loading.
	 * 
	 * @private
	 * 
	 */
	SoundJS.AUDIO_COMPLETE = "canplaythrough";
	
	/**
	 * The name of the JavaScript event dispatched by an audio tag when an a sound has finished playing.
	 * 
	 * @private
	 * 
	 */
	SoundJS.AUDIO_ENDED = "ended";
	
	/**
	 * The name of the JavaScript event dispatched by an audio tag when an a sound has stalled
	 * 
	 * @private
	 * 
	 */
	SoundJS.AUDIO_STALLED = "stalled";
	
	/**
	 * Master volume value.
	 * 
	 * @private
	 * 
	 */
	SoundJS._master = 1;
	
	/**
	 * Current Load progress.
	 * 
	 * @private
	 * 
	 */
	SoundJS._currentLoad = 0;
	
	/**
	 * Manage, load, and perform DOM injection of a sound. If the load queue is empty, it will trigger an immediate load,
	 * otherwise it will be added to the end of the loading queue and loaded in sequence. If instances of a sound by that 
	 * name already exist, the number of instances is increased and the element 'src' is ignored.
	 * 
	 * @method add
	 * 
	 * @param {String} name : The reference to this sound effect
	 * @param {String} src : The filepath to load from
	 * @param {Number} instances : The number of simultaneous versions of this sound you wish to play (max sounds limited by Browser and Computer).
	 * 
	 */
	SoundJS.add = function(name, src, instances) {
		SoundJS.loadQueue.push({name:name, src:src, instances:instances});
		
		// start loading if the queue is empty
		if (SoundJS.loadQueue.length == 1) {
			SoundJS.itemsToLoad = 1;
			SoundJS.loadNext();
		} else {
			SoundJS.itemsToLoad++;
		}
	};
	
	/**
	 * Manage, load, and perform DOM injections of a sound, or set of sounds.
	 * This method is identical to the SoundJS.add() method, except:
	 * 	1) An array of objects representing the parameters for each add call is required.
	 * 	   [{name:'soundName', src:'sound.mp3', instances:1}, {name:'soundName', src:'sound.ogg', instances:4}]
	 * 
	 *  2) It waits until all items are added to the queue before beginning the load operation, which can 
	 *	   even out erroneous finished loading calls in high speed environments such as local environments 
	 *	   or with cached sounds.
	 * 
	 * @method addBatch
	 * 
	 * @param {Array} params : Array of 'name:, src:, instances:' objects.
	 * 
	 * @static
	 * 
	 */
	SoundJS.addBatch = function(params) {
		var l = params.length;
		while(params.length) {
			SoundJS.loadQueue.push(params.shift());
		}
		
		// start loading the queue is empty
		if (SoundJS.loadQueue.length == l) {
			SoundJS.loadNext();
			SoundJS.itemsToLoad = l;
		} else {
			SoundJS.itemsToLoad++;
		}
	};
	
	/**
	 * Play the a sound file with the defined properties.
	 *
	 * The function returns one of three things; 
	 *	1) The instance number played if sound was played successfully
	 *	2) 'NaN' if an erroneous parameter is passed, or the interrupt method forbids playing the sound
	 * 	3) -1 on a delayed call, as the instance being played cannot be determined till the delay is over
	 *
	 * If the instance is needed on a delayed call, the best practice is to delay the call like so:
	 * 	e.g. setTimeout(function(){ myVar = SoundJS.play("sound")}, 3000);
	 * 	Note: this closure is needed for full functionality cross browsers.
	 * 
	 * @method play
	 * 
	 * @param {String} name : Specifies the url to the sound file to play (as defined in the add functions).
	 * @param {Number} interrupt = SoundJS.INTERRUPT_NONE: (optional) Defines the interrupt behavior if all instances are currently used.
	 * @param {Number} volume = 1: (optional) Specifies to volume at which to play that sound instance.
	 * @param {Boolean} loop = false: (optional) Sets the loop parameter on the sound instance.
	 * @param {Number} delay = 0: (optional) Specifies how long to wait before looking for a sound instance to play the sound.
	 * 
	 * @return {Number} The index of the sound played, NaN, or -1.
	 * 
	 * @static
	 * 
	 */
	SoundJS.play = function(name, interrupt, volume, loop, delay) {
		// deal with illegal input		
		if (name == null || SoundJS.soundHash[name] == null || SoundJS.soundHash[name].length == 0 ||
			(interrupt != SoundJS.INTERRUPT_ANY && interrupt != SoundJS.INTERRUPT_EARLY && interrupt != SoundJS.INTERRUPT_LATE
			&& interrupt != SoundJS.INTERRUPT_NONE && interrupt != null)) { return NaN; }
		
		// assign default values if null and correct inputs
		if (interrupt == null) { interrupt = SoundJS.INTERRUPT_NONE; }
		if (loop == null) { loop = false; }
		if (!delay) { delay = 0; }
		if (volume == null || volume > 1) { volume = 1; }
		else if (volume < 0) { volume = 0; }
		
		// move onto playing
		if (delay > 0) {
			setTimeout(function(){SoundJS.beginPlaying(name, interrupt, volume, loop);}, delay); // closure to fix issues in IE9
		} else {
			return SoundJS.beginPlaying(name, interrupt, volume, loop);
		}
		
		return -1;
	};
	
	/**
	 * Get the current master volume level
	 * 
	 * @method getMasterVolume
	 * 
	 * @static
	 * 
	 */
	SoundJS.getMasterVolume = function() { return SoundJS._master; }
	
	
	/**
	 * Change the master volume level
	 * 
	 * @method setMasterVolume
	 * 
	 * @param {Number} value = null: (optional) New master volume.
	 * 
	 * @static
	 * 
	 */
	SoundJS.setMasterVolume = function(value) {
		// don't deal with no volume
		if (Number(value) == null) { return; }
		
		// fix out of range
		if (value < 0) { value = 0; }
		else if (value > 1) { value = 1; }
		
		var i, l, o, old, sound;
		
		old = SoundJS._master;
		SoundJS._master = value;
		
		if (SoundJS._master != old) {
			// adjust all
			for(sound in SoundJS.soundHash) {
				o = SoundJS.soundHash[sound];
				l = o.length;
				for(i = 0; i < l; i++) {
					o[i].volume = o[i].storedVolume * SoundJS._master;
				}
			}
		}
	};
	
	/**
	 * Remove the specified number of sound instances from the DOM. WARNING: remove ignores interrupt 
	 * modes and current actions, and will remove the last instances regardless of their status.
	 * 
	 * @method remove
	 * 
	 * @param {String} name = null: (optional) Note that the function removes all sounds if it is null.
	 * @param {Number} count = null: (optional) Note that the function removes all instances if it is null.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.remove = function(name, count) {
		var i, l, o, sound;
		
		// global remove
		if (name == null){
			for(sound in SoundJS.soundHash) {
				o = SoundJS.soundHash[sound];
				l = o.length;
				do {
					SoundJS.stop(sound, l-1);
					o[l-1].currentSrc = "";
					document.body.removeChild(o[l-1]);
					o.pop();
					l = o.length;
					SoundJS.instanceCount--;
				} while(l);
			}
		} else {
			o = SoundJS.soundHash[name];
			if (o == null) { return false; }
			l = o.length;
			
			// sound remove
			if (count == null) {
				do {
					SoundJS.stop(name, l-1);
					o[l-1].currentSrc = "";
					document.body.removeChild(o[l-1]);
					o.pop();
					l = o.length;
					SoundJS.instanceCount--;
				} while(l);
			// count remove
			} else {
				if (count <= 0 || l <= 0) { return false; }
				l--;
				
				for(i = 0; i <= l && i < count; i++) {
					SoundJS.stop(name, l-i);
					o[l-i].currentSrc = "";
					document.body.removeChild(o[l-i]);
					o.pop();
					SoundJS.instanceCount--;
				}
			}
		}
		
		return true;
	};
	
	/**
	 * Adjust the volume of specified instance(s) of this sound.
	 * 
	 * @method setVolume
	 * 
	 * @param {String} value : The volume to set the target to.
	 * @param {String} name = null: (optional) If null the function adjusts all sounds.
	 * @param {Number} instance = null: (optional) If null the function adjusts all instances.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.setVolume = function(value, name, instance) {
		var i, l, o, sound, stored;
		
		// don't deal with no volume
		if (value == null) { return false; }
		stored = value;
		value = value * SoundJS._master;
		
		// global volume adjust
		if (name == null){
			for(sound in SoundJS.soundHash) {
				o = SoundJS.soundHash[sound];
				l = o.length;
				for(i = 0; i < l; i++) {
					o[i].storedVolume = value;
					o[i].volume = value;
				}
			}
		} else {
			o = SoundJS.soundHash[name];
			if (o == null) { return false; }
			l = o.length;
				
			// sound volume adjust
			if (instance == null) {
				for(i = 0; i < l; i++) {
					o[i].storedVolume = value;
					o[i].volume = value;
				}
			// instance volume adjust
			} else {
				if (l <= instance) { return false; }
				o[instance].storedVolume = value;
				o[instance].volume = value;
			}
		}
		
		return true;
	};
	
	/**
	 * Get the volume of a sound instance. If no instance is provided the volume of the first instance will be returned.
	 *
	 * @method getVolume
	 *
	 * @param {String} name = null: (optional) If null the function adjusts all sounds.
	 * @param {Number} instance = null: (optional) If null the function gets the first instance.
	 *
	 * @return {Number} the volume of the specified instance or -1 if the instance does not exist.
	 *
	 * @static
	 */
	SoundJS.getVolume = function(name, instance) {
		var o = SoundJS.soundHash[name];
		if (o == null || o.length == 0) { return -1; }
		if (instance == null) {
			return o[1].storedVolume;
		} else {
			if (o.length < instance) { return -1; }
			return o[instance].storedVolume;
		}
	}
	
	/**
	 * Specify the mute value of specified instance(s) of this sound.
	 * 
	 * @method setMute
	 * 
	 * @param {String} isMuted : Whether or not the target is muted.
	 * @param {String} name = null: (optional) Note: The function adjusts all sounds if the value is null.
	 * @param {Array} instance = null: (optional) Note: The function adjusts all instances if the value is null.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.setMute = function(isMuted, name, instance) {
		var i, l, o, sound;
		
		// don't deal with no volume
		if (isMuted == null) { return false; }
		
		// global volume adjust
		if (name == null){
			for(sound in SoundJS.soundHash) {
				o = SoundJS.soundHash[sound];
				l = o.length;
				for(i = 0; i < l; i++) {
					o[i].muted = isMuted;
				}
			}
		} else {
			o = SoundJS.soundHash[name];
			if (o == null) { return false; }
			l = o.length;
				
			// sound volume adjust
			if (instance == null) {
				for (i = 0; i < l; i++) {
					o[i].muted = isMuted;
				}
			// instance volume adjust
			} else {
				if (l <= instance) { return false; }
				o[instance].muted = isMuted;
			}
		}
		
		return true;
	};
	
	/**
	 * Pause specified instance(s) of this sound.
	 * 
	 * @method pause
	 * 
	 * @param {String} name = null: (optional) If null the function adjusts all sounds.
	 * @param {Number} instance = null: (optional) If null the function adjusts all instances.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.pause = function(name, instance) {
		var i, l, o, sound;
		
		// global pause
		if (name == null){
			for(sound in SoundJS.soundHash) {
				o = SoundJS.soundHash[sound];
				l = o.length;
				for(i = 0; i < l; i++) {
					o[i].pause();
				}
			}
		} else {
			o = SoundJS.soundHash[name];
			if (o == null) { return false; }
			l = o.length;
			
			// sound pause
			if (instance == null) {
				for(i = 0; i < l; i++) {
					o[i].pause();
				}
			// instance pause
			} else {
				if (l <= instance) { return false; }
				o[instance].pause();
			}
		}
		
		return true;
	};
	
	/**
	 * Resume specified instance(s) of this sound.
	 * 
	 * @method resume
	 * 
	 * @param {String} name = null: (optional) If null the function adjusts all sounds.
	 * @param {String} instance = null: (optional) If null the function adjusts all instances.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.resume = function(name, instance) {
		var i, l, o, sound;
		
		// global resume
		if (name == null){
			for(sound in SoundJS.soundHash) {
				l = SoundJS.soundHash[sound].length;
				for(i = 0; i < l; i++) {
					o = SoundJS.soundHash[sound][i];
					if (o.loop || (o.currentTime != o.duration && o.currentTime != 0)){
						o.play();
					}
				}
			}
		} else {
			if (SoundJS.soundHash[name] == null) { return false; }
			l = SoundJS.soundHash[name].length;
			
			// sound resume
			if (instance == null) {
				for(i = 0; i < l; i++) {
					o = SoundJS.soundHash[name][i];
					if (o.loop || (o.currentTime != o.duration && o.currentTime != 0)){
						o.play();
					}
				}
			// instance resume
			} else {
				if (l <= instance) { return false; }
				o = SoundJS.soundHash[name][instance];
				if (o.loop || (o.currentTime != o.duration && o.currentTime != 0)){
					o.play();
				}
			}
		}
		
		return true;
	};
	
	/**
	 * Stop specified instance(s) of this sound.
	 * 
	 * @method stop
	 * 
	 * @param {String} name = null: (optional) If null the function adjusts all sounds.
	 * @param {String} instance = null: (optional) If null the function adjusts all instances.
	 * 
	 * @return {Boolean} Success of operation.
	 * 
	 * @static
	 * 
	 */
	SoundJS.stop = function(name, instance) {
		var i, l, o, sound;
		
		// global stop
		if (name == null){
			for(sound in SoundJS.soundHash) {
				l = SoundJS.soundHash[sound].length;
				for(i = 0; i < l; i++) {
					o = SoundJS.soundHash[sound][i];
					try { o.currentTime = 0; } catch(e) {} // Firefox chokes on this for stopped sounds.
					o.pause();
				}
			}
		} else {
			if (SoundJS.soundHash[name] == null) { return false; }
			l = SoundJS.soundHash[name].length;
			
			// sound stop
			if (instance == null) {
				for(i = 0; i < l; i++) {
					o = SoundJS.soundHash[name][i];
					o.currentTime = 0;
					o.pause();
				}
			// instance stop
			} else {
				if (l <= instance) { return false; }
				o = SoundJS.soundHash[name][instance];
				o.currentTime = 0;
				o.pause();
			}
		}
		
		return true;
	};
	
	/**
	 * Check to see if specified sound is loaded/valid.
	 * If the value of the name is null, check all sounds are loaded.
	 *
	 * @method isLoaded
	 *
	 * @param {String} name = null: (optional) The sound to check.
	 * 
	 * @return {Boolean} Indicating if the specified sound is valid & loaded 
	 * 
	 * @static
	 * 
	 */
	SoundJS.isLoaded = function(name) {
		var result = true;
		var sound;
			
		if (name == null) {
			// global isLoaded
			for(sound in SoundJS.soundHash) {
				result = result && SoundJS.soundHash[sound] && SoundJS.soundHash[sound][0] && SoundJS.soundHash[sound][0].loaded;
				if (!result) { return result; }
			}
		} else {
			// sound isLoaded
			return SoundJS.soundHash[name] && SoundJS.soundHash[name][0] && SoundJS.soundHash[name][0].loaded;
		}
		
		return result;
	};
	
	/**
	 * List the number of instances used by a specific sound. 
	 * If the value of the name is null, check the entire system
	 *
	 * @method getNumInstances
	 * 
	 * @param {String} name = null: (optional) Name of the sound to lookup.
	 * 
	 * @return {Number} The number of instances currently instantiated or -1 if an invalid name is passed in.
	 * 
	 * @static
	 * 
	 */
	SoundJS.getNumInstances = function(name) {
		var sound;
		
		if (name == null) {
			return instanceCount;
		} else if (SoundJS.soundHash[name]){
			return SoundJS.soundHash[name].length;
		} else {
			return -1;
		}
	};
	
	/**
	 * Get the maximum number of instances the browser can run.
	 *
	 * @method getMaxInstances
	 * 
	 * @return {Number} Assumption of maximum instances the browser can run,
	 * the actual number varies from browser to browser and machine to machine, and
	 * is largely based on the sound card.
	 * 
	 * @static
	 * 
	 */
	SoundJS.getMaxInstances = function() {
		return SoundJS.INST_MAX;
	};
	
	/**
	 * Get the current load progress for the sound queue.
	 *
	 * @method getCurrentLoadProgress
	 * 
	 * @return {Number} A number 0-1 indicating percentage loaded of the current loading queue.
	 * 
	 * @static
	 * 
	 */
	SoundJS.getCurrentLoadProgress = function() {
		//return (SoundJS.itemsToLoad - SoundJS.loadQueue.length - SoundJS._currentLoad) / SoundJS.itemsToLoad;
		//TD: Fix
		return (SoundJS.itemsToLoad - SoundJS.loadQueue.length - (1 - SoundJS._currentLoad)) / SoundJS.itemsToLoad; 
	};
	
	/**
	 * Get a reference to the DOM sound object by name and instance.
	 *
	 * @method getInstance
	 *
	 * @param {String} name : The sound name to find the instance in.
	 * @param {String} instance : The specific instance to grab.
	 * 
	 * @return {Sound object} The Sound Element specified by name and instance or null.
	 * 
	 * @static
	 * 
	 */
	SoundJS.getInstance = function(name, instance) {
		if (name == null || instance < 0 || !SoundJS.soundHash[name] || !SoundJS.soundHash[name][instance]) { return null; }
		
		return SoundJS.soundHash[name][instance];
	};
	
	/**
	 * Internal function to actual begin playing a sound.
	 * Use .play() instead for type checking and default paramters, calling this directly may crash.
	 *
	 * @private
	 * 
	 */
	SoundJS.beginPlaying = function(name, interrupt, volume, loop) {
		// find correct instance
		var i, result, target, examine;
		var shouldReplace = false;
		var instances = SoundJS.soundHash[name];
		
		// TODO: Determine if the audio is not loaded, or IO errors.
		if (!instances[0].loaded) {
			throw(new Error("Audio is not loaded. The source(s) are either not found, or the correct audio formats are not provided."));
		}
		
		var l = instances.length;
		
		for(i = 0; i < l; i++) {
			// init
			examine = instances[i];
			if (target == null && interrupt != SoundJS.INTERRUPT_ANY && interrupt != SoundJS.INTERRUPT_NONE) {
				target = examine;
				result = i;
			}
			
			// check interrupt types
			if ((examine.currentTime >= (examine.duration - SoundJS.FT) && !examine.loop) ||
				(examine.currentTime == 0 && examine.paused)) {
				// unused
				shouldReplace = true;
				l = i;
			} else {
				// compare
				if ((interrupt == SoundJS.INTERRUPT_EARLY && examine.currentTime < target.currentTime) ||
					(interrupt == SoundJS.INTERRUPT_LATE && examine.currentTime > target.currentTime)){
					shouldReplace = true;
				}
			}
			
			// use marked item instead
			if (shouldReplace) {
				target = examine;
				result = i;
			}
		}
		
		// if nothing is found replace the first one in the list
		if (interrupt == SoundJS.INTERRUPT_ANY && !target){
			target = instances[0];
			result = 0;
		}
		
		
		
		if (target) {
			// play sound instance
			target.loop = loop;
			target.storedVolume = volume;
			target.volume = volume * SoundJS._master;
			target.currentTime = 0;
			if (target.paused){ target.play(); }
			
			return result;
		}
		
		// indicate no available instance
		return -1;
	};
	
	/** 
	 * Advances the loading queue. Do not call manually, as it assumes the previous item has loaded succesfully
	 * and may corrupt the loading procedure. Call .add() or .addBatch() instead.
	 *
	 * @private
	 * 
	 */
	SoundJS.loadNext = function() {
		if (SoundJS.loadQueue.length <= 0) {
			if (SoundJS.onLoadQueueComplete) { SoundJS.onLoadQueueComplete(); }
			return;
		}
		
		// load next item in the queue.
		var o = SoundJS.loadQueue.shift();
		var instances = o.instances || 1;
		var name = o.name;
		var src = o.src;
		
		// build hash, and extend already existing names
		var hash = SoundJS.soundHash[name];
		if (hash == null) { hash = SoundJS.soundHash[name] = []; }
		else if (hash.length) { src = hash[0].src; }
		var init = hash.length;
		
		for(var i=init, l=init+instances; i<l; i++){
			var audio = document.createElement("audio");
			// only fire events on the first instance of a sound.
			if (i == init) {
				audio.timeoutId = setTimeout(function(){ SoundJS.handleAudioTimeout(audio);}, SoundJS.AUDIO_TIMEOUT);
				audio.addEventListener(SoundJS.AUDIO_COMPLETE, SoundJS.handleAudioComplete, false);
				audio.addEventListener(SoundJS.AUDIO_PROGRESS, SoundJS.handleProgress, false);
				audio.addEventListener(SoundJS.AUDIO_STALLED, SoundJS.handleAudioStall, false); // Occasionally we get a stalled event instead of complete - but it still works.
				audio.addEventListener(SoundJS.AUDIO_ERROR, SoundJS.handleAudioError, false);
								
				//var mediaEvents = ["abort", "canplay", "canplaythrough", "duratichange", "emptied", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting"];
				
				// TODO: Retry.
				audio.loaded = false;
			}
			
			//TODO: Consider only making additional channels once the audio loads.
			
			audio.addEventListener(SoundJS.AUDIO_ENDED, SoundJS.handleEnded, false);
			
			// set correct id for lookup, loading method and data types
			audio.setAttribute("id", name + "_" + i);
			audio.setAttribute("preload", "auto");			
			
			// figure out sound specific data
			var type;
			if (src instanceof Array) {
				for (var j=0, l2=src.length; j<l2; j++) {
					var source = audio.appendChild(document.createElement("source"));
					type = SoundJS.getType(src[j]);
					source.setAttribute("type", type);
					source.setAttribute("src", src[j]);
				}
				
			} else {
				type = SoundJS.getType(src);
				audio.setAttribute("type", type);
				audio.setAttribute("src", src);
			}
			
			audio.load(); // iOS fix
			
			// include into list and document
			document.body.appendChild(audio);
			SoundJS.soundHash[name].push(audio);
			SoundJS.instanceCount++;
		}
	};
	
	/**
	 * Determine the type of a file.
	 *
	 * @private
	 *
	 */
	SoundJS.getType = function(src) {
		var type = src.slice(src.lastIndexOf(".")+1);
		switch(type){
			case "mp3" : return "audio/mpeg";
			case "ogg" : return "audio/ogg";
			case "wav" : return "audio/wav";
			default : throw("'" + src + "' is not a recognized audio file"); //LM: Throw seems excessive. Maybe we should dispatch error and move one?
		}
		return null;
	}
	
	
	/**
	 * The audio has finished playing. This happens only on non-looping audio.
	 *
	 * @private
	 *
	 */
	SoundJS.handleEnded = function(event) {
		if (SoundJS.onSoundEnded) {
			var parts = this.id.split("_");
			SoundJS.onSoundEnded(this, parts[0], parts[1]);	
		}
	}
	
	/**
	 * Checks if callback exists and calls it with the name of sound having problems.
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.handleAudioTimeout = function(audio) {
		// audio object that timed out
		if (SoundJS.onSoundTimeout) { 
			var parts = audio.id.split("_");
			SoundJS.onSoundTimeout(audio, parts[0], parts[1]);
		}
		//TODO: Indicate to the audio that it is done, but timed out. Maybe remove event listeners.
		SoundJS.loadNext();
	};
	
	
	/** 
	 * Checks if callback exists and calls it with updated progress.
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.handleProgress = function(event) {
		// This occasionally throws errors (???). Just skip it, since progress isn't super important.
		try {
			var e = this.buffered.end();
		} catch (error) {
			return;	
		}
		SoundJS._currentLoad = this.buffered.end()/this.duration;
		if (SoundJS.onProgress) { SoundJS.onProgress(SoundJS.getCurrentLoadProgress()); }
	};
	
	/** 
	 * Checks if callback exists and calls it with the name of sound having problems.
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.handleAudioError = function(event) {
		clearTimeout(this.timeoutId);
		
		// do something about the error
		if (SoundJS.onSoundLoadError) { 
			var parts = this.id.split("_");
			SoundJS.onSoundLoadError(this, parts[0], parts[1]);
		}
		SoundJS.loadNext();
		
		//TODO: Indicate that the sound failed.
	};
	
	/**
	 * Checks if callback exists and calls it with the name of sound finished.
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.handleAudioComplete = function(event) {
		var parts = this.id.split("_");
		
		// clean up refiring
		this.removeEventListener(SoundJS.AUDIO_COMPLETE, SoundJS.handleAudioComplete, false);
		clearTimeout(this.timeoutId);
		
		// set properties
		this.loaded = true;
		
		// advance progress and/or fire events
		if (SoundJS.onSoundLoadComplete) { SoundJS.onSoundLoadComplete(this, parts[0], parts[1]); }
		SoundJS.loadNext();
	};
	
	
	/**
	 * Recognizes a stall; however, delays it in case of event duplication with a load&stall firing
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.handleAudioStall = function(event) {
		setTimeout(function(){testAudioStall(event)}, 0);
	}
	
	
	/**
	 * Checks if callback exists and calls it with the name of sound stalling.
	 * Do not call directly as this is an event listener.
	 * 
	 * @private
	 * 
	 */
	SoundJS.testAudioStall = function(event) {
		var parts = this.id.split("_");
		
		if(SoundJS.soundHash[parts[0]][parts[1]].loaded){
			return;
		}
		
		if (SoundJS.onStall) { 
			SoundJS.onStall(this, parts[0], parts[1]);
		}
		
		SoundJS.loadNext();
	}

window.SoundJS = SoundJS;

	function SoundJSElement(name, src) {
		this.instances = [];	
		this.name = name;
		this.src = src;
		this.canPlay = false;
		this.loaded = false;
		this.length = 0;
	}
	var p = SoundJSElement.prototype;
	p.add = function(instance) {
		this.instances.push(instance);	
		this.length = this.instances.length;
		
		if (this.instances.length == 1) {
			instance.addEventListener("canplaythrough", function(target) { instance.canplaythrough(); });
		}
	}
	p.remove = function(instance) {
		this.instances.splice(instance, 1);
		this.length = this.instances.length;
	}
	p.canplaythrough = function() {
		this.loaded = true;	
	}
	
window.SoundJSElement = SoundJSElement;

}(window));
