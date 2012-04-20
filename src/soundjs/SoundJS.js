/*
* SoundJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
*
* Copyright (c) 2012 gskinner.com, inc.
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
 * The SoundJS library manages the playback of audio in HTML, via plugins which
 * abstract the actual implementation, and allow multiple playback modes depending
 * on the environment.
 *
 * For example, a developer could specify:
 *   [WebAudioPlugin, HTML5AudioPlugin, FlashAudioPlugin]
 * In the latest browsers with webaudio support, a WebAudio plugin would be used,
 * other modern browsers could use HTML5 audio, and older browsers with no HTML5
 * audio support would use the Flash Plugin.
 *
 * Note that there is not currently a supported WebAudio plugin.
 *
 * @module SoundJS
 */
(function(window) {

	//TODO: Interface to validate plugins and throw warnings
	//TODO: Determine if methods exist on a plugin before calling
	//TODO: Interface to validate instances and throw warnings
	//TODO: Surface errors on audio from all plugins

	//TODO: Timeouts
	//TODO: Put Plugins on SoundJS.lib?

	/**
	 * The public API for creating sounds, and controlling the overall sound levels,
	 * and affecting multiple sounds at once. All SoundJS APIs are static.
	 *
	 * SoundJS can also be used as a PreloadJS plugin to help preload audio properly.
	 * @class SoundJS
	 * @constructor
	 */
	function SoundJS() {
		throw "SoundJS cannot be instantiated";
	}

	/**
	 * Determine how audio is split, when multiple paths are specified in a source.
	 * @property DELIMITER
	 * @type String
	 * @default |
	 * @static
	 */
	SoundJS.DELIMITER = "|";

	/**
	 * The duration in milliseconds to determine a timeout.
	 * @property AUDIO_TIMEOUT
	 * @static
	 * @type Number
	 * @default 8000
	 */
	SoundJS.AUDIO_TIMEOUT = 8000; //TODO: Not fully implemented

	/**
	 * The interrupt value to use to interrupt any currently playing instance with the same source.
	 * @property INTERRUPT_ANY
	 * @type String
	 * @default any
	 * @static
	 */
	SoundJS.INTERRUPT_ANY = "any";

	/**
	 * The interrupt value to use to interrupt the earliest currently playing instance with the same source.
	 * @property INTERRUPT_EARLY
	 * @type String
	 * @default early
	 * @static
	 */
	SoundJS.INTERRUPT_EARLY = "early";

	/**
	 * The interrupt value to use to interrupt the latest currently playing instance with the same source.
	 * @property INTERRUPT_LATE
	 * @type String
	 * @default late
	 * @static
	 */
	SoundJS.INTERRUPT_LATE = "late";

	/**
	 * The interrupt value to use to interrupt no currently playing instances with the same source.
	 * @property INTERRUPT_NONE
	 * @type String
	 * @default none
	 * @static
	 */
	SoundJS.INTERRUPT_NONE = "none";

	// Important, implement playState in plugins with these values.

	/**
	 * Defines the playState of an instance that is still initializing.
	 * @property PLAY_INITED
	 * @type String
	 * @default playInited
	 * @static
	 */
	SoundJS.PLAY_INITED = "playInited";

	/**
	 * Defines the playState of an instance that is currently playing or paused.
	 * @property PLAY_SUCCEEDED
	 * @type String
	 * @default playSucceeded
	 * @static
	 */
	SoundJS.PLAY_SUCCEEDED = "playSucceeded";

	/**
	 * Defines the playState of an instance that was interrupted by another instance.
	 * @property PLAY_INTERRUPTED
	 * @type String
	 * @default playInterrupted
	 * @static
	 */
	SoundJS.PLAY_INTERRUPTED = "playInterrupted";

	/**
	 * Defines the playState of an instance that completed playback.
	 * @property PLAY_FINISHED
	 * @type String
	 * @default playFinished
	 * @static
	 */
	SoundJS.PLAY_FINISHED = "playFinished";

	/**
	 * Defines the playState of an instance that failed to play. This is usually caused by a lack of available channels
	 * when the interrupt mode was "INTERRUPT_NONE", the playback stalled, or the sound could not be found.
	 * @property PLAY_FAILED
	 * @type String
	 * @default playFailed
	 * @static
	 */
	SoundJS.PLAY_FAILED = "playFailed";

	/**
	 * The currently active plugin. If this is null, then no plugin could be initialized.
	 * If no plugin was specified, only the HTMLAudioPlugin is tested.
	 * @property activePlugin
	 * @type Object
	 * @default null
	 * @static
	 */
	SoundJS.activePlugin = null;

// Private
	SoundJS.pluginsRegistered = false;
	SoundJS.masterVolume = 1;
	SoundJS.muted = false;
	SoundJS.instances = [];
	SoundJS.instanceHash = {};
	SoundJS.idHash = null;

	/**
	 * Get the preload rules to be used by PreloadJS. This function should not be called, except by PreloadJS.
	 * @return {Object} The callback, file types, and file extensions to use for preloading.
	 * @static
	 * @private
	 */
	SoundJS.getPreloadHandlers = function() {
		return {
			callback: SoundJS.proxy(SoundJS.initLoad, SoundJS),
			types: ["sound"],
			extensions: ["mp3", "ogg", "wav"]
		}
	}

	/**
	 * Register a list of plugins, in order of precedence.
	 * @method registerPlugins
	 * @param {Array} plugins An array of plugins to install.
	 * @return {Boolean} Whether a plugin was successfully initialized.
	 * @static
	 */
	SoundJS.registerPlugins = function(plugins) {
		SoundJS.pluginsRegistered = true;
		for (var i=0, l=plugins.length; i<l; i++) {
			var plugin = plugins[i];
			if (plugin == null) { continue; } // In case a plugin is not defined.
			// Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instances
			if (plugin.isSupported()) {
				SoundJS.activePlugin = new plugin();
				//TODO: Check error on initialization?
				return true;
			}
		}
		return false;
	}

	/**
	 * Register a SoundJS plugin. Plugins handle the actual playing
	 * of audio. By default the HTMLAudio plugin will be installed if
	 * no other plugins are present when the user starts playback.
	 * @method registerPlugin
	 * @param {Object} plugin The plugin class to install.
	 * @return {Boolean} Whether the plugin was successfully initialized.
	 * @static
	 */
	SoundJS.registerPlugin = function(plugin) {
		SoundJS.pluginsRegistered = true;
		if (plugin.isSupported()) {
			SoundJS.activePlugin = new plugin();
			return true;
		}
		return false;
	}

	/**
	 * Determines if SoundJS has been initialized, and a plugin has been activated.
	 * @method isReady
	 * @return {Boolean} If SoundJS has initialized a plugin.
	 * @static
	 */
	SoundJS.isReady = function() {
		return (SoundJS.activePlugin != null);
	}

	/**
	 * Get the active plugin's capabilities.
	 * @method getCapabilities
	 * @return {Object} An object containing the capabilities of the active plugin.
	 * @static
	 */
	SoundJS.getCapabilities = function() {
		return SoundJS.activePlugin ? SoundJS.activePlugin.capabilities : null;
	}

	/**
	 * Get a specific capability of the active plugin
	 * @method getCapability
	 * @param {String} key The capability to retrieve
	 * @return {String | Number | Boolean} The capability value.
	 * @static
	 */
	SoundJS.getCapability = function(key) {
		if (SoundJS.activePlugin == null) { return null; }
		return SoundJS.activePlugin.capabilities[key];
	}

	/**
	 * Process manifest items from PreloadJS.
	 * @method initLoad
	 * @param {String | Object} value The src or object to load
	 * @param {String} type The optional type of object. Will likely be "sound".
	 * @param {String} id An optional id
	 * @param {Number | String | Boolean | Object} data Optional data associated with the item
	 * @return {Object} An object with the modified values that were passed in.
	 * @private
	 */
	SoundJS.initLoad = function(src, type, id, data) {
		if (!SoundJS.checkPlugin(true)) { return false; }

		var details = SoundJS.parsePath(src, type, id, data);
		if (details == null) { return false; }

		if (id != null) {
			if (SoundJS.idHash == null) { SoundJS.idHash = {}; }
			SoundJS.idHash[id] = details.src;
		}

		var ok = SoundChannel.create(details.src, data);
		var instance = SoundJS.activePlugin.register(details.src, data);
		if (instance != null) {
			// If the instance returns a tag, return it instead for preloading.
			if (instance.tag != null) { details.tag = instance.tag; }
			else if (instance.src) { details.src = instance.src; }
			// If the instance returns a complete handler, pass it on to the prelaoder.
			if (instance.completeHandler != null) { details.handler = instance.completeHandler; }
		}
		return details;
	}

	/**
	 * Parse the path of a manifest item
	 * @method parsePath
	 * @param {String | Object} value
	 * @param {String} type
	 * @param {String} id
	 * @param {Number | String | Boolean | Object} data
	 * @return {Object} A formatted object to load.
	 * @private
	 */
	SoundJS.parsePath = function(value, type, id, data) {
		// Assume value is string.
		var sounds = value.split(SoundJS.DELIMITER);
		var ret = {type:type||"sound", id:id, data:data, handler:SoundJS.handleSoundReady};
		var found = false;
		var c = SoundJS.getCapabilities();
		for (var i=0, l=sounds.length; i<l; i++) {
			var sound = sounds[i];
			var point = sound.lastIndexOf(".");
			var ext = sound.substr(point+1).toLowerCase();
			var name = sound.substr(0, point).split("/").pop();
			switch (ext) {
				case "mp3":
					if (c.mp3) { found = true; }
					break;
				case "ogg":
					if (c.ogg) { found = true }
					break;
				case "wav":
					if (c.wav) { found = true; }
					break;
				// TODO: Other cases.
			}

			if (found) {
				ret.name = name;
				ret.src = sound;
				ret.extension = ext;
				return ret;
			}
		}
		return null;
	}


	/* ---------------
	 Static API.
	--------------- */
	/**
	 * Play a sound, receive an instance to control
	 * @method play
	 * @param {String} value The src or ID of the audio.
	 * @param {String} interrupt How to interrupt other instances of audio. Values are defined as constants on SoundJS.
	 * @param {Number} delay The amount of time to delay the start of the audio. Delay is in milliseconds.
	 * @param {Number} offset The point to start the audio. Offset is in milliseconds.
	 * @param {Number} loop Determines how many times the audio loops when it reaches the end of a sound. Default is 0 (no loops). Set to -1 for infinite.
	 * @param {Number} volume The volume of the sound, between 0 and 1
	 * @param {Number} pan The left-right pan of the sound (if supported), between -1 (left) and 1 (right)
	 * @return {SoundInstance} A SoundInstance that can be controlled after it is created.
	 * @static
	 */
	SoundJS.play = function (src, interrupt, delay, offset, loop, volume, pan) {
		if (!SoundJS.checkPlugin(true)) { return null; }
		src = SoundJS.getSrcFromId(src);
		var instance = SoundJS.activePlugin.create(src);
		return SoundJS.playInstance(instance, interrupt, delay, offset, loop, volume, pan);
	}

	/**
	 * Play an instance. This is called by the static API, as well as from plugins.
	 * @private
	 */
	SoundJS.playInstance = function(instance, interrupt, delay, offset, loop, volume, pan) {
		interrupt = interrupt || SoundJS.INTERRUPT_NONE;
		if (delay == null) { delay = 0; }
		if (offset == null) { offset = 0; }
		if (loop == null) { loop = 0; }
		if (volume == null) { volume = 1; }
		if (pan == null) { pan = 0; }

		if (delay == 0) {
			var ok = SoundJS.beginPlaying(instance, interrupt, offset, loop, volume, pan);
			if (!ok) { return null; }
		} else {
			//Note that we can't pass arguments to proxy OR setTimeout (IE), so just wrap the function call.
			setTimeout(function() {
					SoundJS.beginPlaying(instance, interrupt, offset, loop, volume, pan);
				}, delay); //LM: Can not stop before timeout elapses. Maybe add timeout interval to instance?
		}

		this.instances.push(instance);
		this.instanceHash[instance.uniqueId] = instance;

		return instance;
	}

	/**
	 * Begin playback. This is called immediately, or after delay by SoundJS.beginPlaying
	 * @private
	 */
	SoundJS.beginPlaying = function(instance, interrupt, offset, loop, volume, pan) {
		if (!SoundChannel.add(instance, interrupt)) { return false; }
		var result = instance.beginPlaying(offset, loop, volume, pan);
		if (result == -1) {
			this.instances.splice(this.instances.indexOf(instance), 1);
			delete this.instanceHash[instance.uniqueId];
			return false;
		}
		return true;
	}

	/**
	 * Determine if a plugin has been initialized. Optionally initialize a default plugin.
	 * @returns If a plugin is initialized.
	 * @private
	 */
	SoundJS.checkPlugin = function(initializeDefault) {
		if (SoundJS.activePlugin == null) {
			if (initializeDefault && !SoundJS.pluginsRegistered) {
				SoundJS.registerPlugin(SoundJS.HTMLAudioPlugin);
			}
			if (SoundJS.activePlugin == null) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get the source of a sound via the ID passed in with the manifest. If no ID is found
	 * the value is passed back.
	 * @method getSrcFromId
	 * @param value The name or src of a sound.
	 * @return {String} The source of the sound.
	 * @static
	 */
	SoundJS.getSrcFromId = function(value) {
		if (SoundJS.idHash == null || SoundJS.idHash[value] == null) { return value; }
		return SoundJS.idHash[value];
	}


/* ---------------
 Global controls
--------------- */
	/**
	 * Set the volume of all sounds. This sets the volume value of all audio, and
	 * is not a "master volume". Use setMasterVolume() instead.
	 * @method setVolume
	 * @param {Number} The volume to set on all sounds. The acceptable range is 0-1.
	 * @param {String} id Optional, the specific sound ID to target.
	 * @return {Boolean} If the volume was set.
	 * @static
	 */
	SoundJS.setVolume = function(value, id) {
		// don't deal with null volume
		if (Number(value) == null) { return false; }
		value = Math.max(0, Math.min(1, value));

		return SoundJS.tellAllInstances("setVolume", id, value);
		/*SoundJS.activePlugin.setVolume(value, SoundJS.getSrcFromId(id));*/
		//return true;
	}

	/**
	 * Get the master volume. All sounds multiply their current volume against the master volume.
	 * @method getMasterVolume
	 * @return {Number} The master volume
	 * @static
	 */
	SoundJS.getMasterVolume = function() { return SoundJS.masterVolume; }
	/**
	 * To set the volume of all instances at once, use the setVolume() method.
	 * @method setMasterVolume
	 * @param {Number} value The master volume to set.
	 * @return {Boolean} If the master volume was set.
	 * @static
	 */
	SoundJS.setMasterVolume = function(value) {
		SoundJS.masterVolume = value;
		return SoundJS.tellAllInstances("setMasterVolume", null, value);
	}

	/**
	 * Mute/Unmute all audio. Note that muted audio still plays at 0 volume, and that
	 * this method just sets the mute value of each instance, and not a "global mute".
	 * @method setMute
	 * @param {Boolean} isMuted Whether the audio should be muted or not.
	 * @param {String} id The specific sound ID (set) to target.
	 * @return {Boolean} If the mute was set.
	 * @static
	 */
	SoundJS.setMute = function(isMuted, id) {
		return SoundJS.tellAllInstances("mute", id, isMuted);
		//LM: Note that there is no "global" mute. Mute just handles all instances.
	}

	/**
	 * Pause all instances.
	 * @method pause
	 * @param id The specific sound ID (set) to target.
	 * @return If the audio was paused or not.
	 * @static
	 */
	SoundJS.pause = function(id) {
		return SoundJS.tellAllInstances("pause", id);
	}

	/**
	 * Resume all instances. Note that the pause/resume methods do not work independantly
	 * of each instance's paused state. If one instance is already paused when the SoundJS.pause
	 * method is called, then it will resume when this method is called.
	 * @method resume
	 * @param id The specific sound ID (set) to target.
	 * @return If the audio was resumed or not
	 * @static
	 */
	SoundJS.resume = function(id) {
		return SoundJS.tellAllInstances("resume", id);
	}

	/**
	 * Stop all audio (Global stop).
	 * @method stop
	 * @param id The specific sound ID (set) to target.
	 * @return If the audio was stopped or not.
	 * @static
	 */
	SoundJS.stop = function(id) {
		return SoundJS.tellAllInstances("stop", id);
	}

	/**
	 * Get a SoundInstance by a unique id. It is often useful to store audio
	 * instances by id (in form elements for example), so this method provides
	 * a useful way to access the instances via their IDs.
	 * @method getInstanceById
	 * @param uniqueId The id to use as lookup.
	 * @return {SoundInstance} The sound instance with the specified ID.
	 * @static
	 */
	SoundJS.getInstanceById = function(uniqueId) {
		return this.instanceHash[uniqueId];
	}

	/**
	 * A sound has completed playback, been interrupted, failed, or been stopped.
	 * Remove instance management. It will be added again, if the sound re-plays.
	 * Note that this method is called from the instances.
	 * @method playFinished
	 * @param {SoundInstance} instance The instance that finished playback.
	 * @private
	 */
	SoundJS.playFinished = function(instance) {
		SoundChannel.remove(instance);
		this.instances.splice(this.instances.indexOf(instance), 1);
		// Note: Keep in instance hash.
	}

	/**
	 * Call a method on all instances. Passing an optional ID will filter the event
	 * to only sounds matching that id (or source).
	 * @private
	 */
	SoundJS.tellAllInstances = function(command, id, value) {
		if (this.activePlugin == null) { return false; }
		var src = this.getSrcFromId(id);
		for (var i=this.instances.length-1; i>=0; i--) {
			var instance = this.instances[i];
			if (src != null && instance.src != src) { continue; }
			switch (command) {
				case "pause":
					instance.pause(); break;
				case "resume":
					instance.resume(); break;
				case "setVolume":
					instance.setVolume(value); break;
				case "setMasterVolume":
					instance.setMasterVolume(value); break;
				case "mute":
					instance.mute(value); break;
				case "stop":
					instance.stop(); break;
				case "setPan":
					instance.setPan(value); break;
			}
		}
		return true;
	}

	/**
	 * A function proxy for SoundJS methods. By default, JavaScript methods do not maintain scope, so passing a
	 * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
	 * ensures that the method gets called in the correct scope. All internal callbacks in SoundJS use this approach.
	 * @method proxy
	 * @param {Function} method The function to call
	 * @param {Object} scope The scope to call the method name on
	 * @static
	 * @private
	 */
	SoundJS.proxy = function(method, scope) {
		return function() {
			return method.apply(scope, arguments);
		}
	}

	// Put SoundJS on window for Global Access
	window.SoundJS = SoundJS;





	/**
	 * SoundChannel manages the number of active instances
	 * @class SoundChannel
	 * @param src The source of the instances
	 * @param max The number of instances allowed
	 * @private
	 */
	function SoundChannel(src, max) {
		this.init(src, max);
	}

/* ------------
   Static API
------------ */
	/**
	 * A hash of channel instances by src.
	 * @property channels
	 * @static
	 * @private
	 */
	SoundChannel.channels = {};
	/**
	 * Create a sound channel.
	 * @method create
	 * @static
	 * @param {String} src The source for the channel
	 * @param {Number} max The maximum amount this channel holds.
	 * @private
	 */
	SoundChannel.create = function(src, max) {
		var channel = SoundChannel.get(src);
		if (channel == null) {
			SoundChannel.channels[src] = new SoundChannel(src, max);
		} else {
			channel.max += max;
		}
	}
	/**
	 * Add an instance to a sound channel.
	 * @method add
	 * @param {SoundInstance} instance The instance to add to the channel
	 * @param {String} interrupt The interrupt value to use
	 * @static
	 * @private
	 */
	SoundChannel.add = function(instance, interrupt) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) { return false; }
		return channel.add(instance, interrupt);
	}
	/**
	 * Remove an instace from its channel.
	 * @method remove
	 * @param {SoundInstance} instance The instance to remove from the channel
	 * @static
	 * @private
	 */
	SoundChannel.remove = function(instance) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) { return false; }
		channel.remove(instance);
		return true;
	}
	/**
	 * Get a channel instance by its src.
	 * @method get
	 * @param {String} src The src to use to look up the channel
	 * @static
	 * @private
	 */
	SoundChannel.get = function(src) {
		return SoundChannel.channels[src];
	}

	var p = SoundChannel.prototype = {

		/**
		 * The src of the channel
		 * @property src
		 * @private
		 */
		src: null,

		/**
		 * The maximum number of instances in this channel
		 * @property max
		 * @private
		 */
		max: null,
		/**
		 * The current number of active instances.
		 * @property length
		 * @private
		 */
		length: 0,

		/**
		 * Initialize the channel
		 * @method init
		 * @param {String} src The source of the channel
		 * @param {Number} max The maximum number of instances in the channel
		 * @private
		 */
		init: function(src, max) {
			this.src = src;
			this.max = max || 1;
			this.instances = [];
		},

		/**
		 * Get an instance by index
		 * @method get
		 * @param {Number} index The index to return.
		 * @private
		 */
		get: function(index) {
			return this.instances[index];
		},

		/**
		 * Add a new instance
		 * @method add
		 * @param {SoundInstance} instance The instance to add.
		 * @private
		 */
		add: function(instance, interrupt) {
			if (!this.getSlot(interrupt, instance)) {
				return false;
			};
			this.instances.push(instance);
			this.length++;
			return true;
		},

		/**
		 * Remove an instance
		 * @method remove
		 * @param {SoundInstance} instance The instance to remove
		 * @private
		 */
		remove: function(instance) {
			var index = this.instances.indexOf(instance);
			if (index == -1) { return false; }
			this.instances.splice(index, 1);
			this.length--;
			return true;
		},

		/**
		 * Get an available slot
		 * @method getSlot
		 * @param {String} interrupt The interrupt value to use.
		 * @param {SoundInstance} instance The sound instance the will go in the channel if successful.
		 * @private
		 */
		getSlot: function(interrupt, instance) {
			var target, replacement;

			var margin = SoundJS.activePlugin.FT || 0;

			for (var i=0, l=this.max||100; i<l; i++) {
				target = this.get(i);

				// Available Space
				if (target == null) {
					return true;
				} else if (interrupt == SoundJS.INTERRUPT_NONE) {
					continue;
				}

				// First replacement candidate
				if (i == 0) {
					replacement = target;
					continue;
				}

				// Audio is complete or not playing
				if (target.playState == SoundJS.PLAY_FINISHED ||
						target == SoundJS.PLAY_INTERRUPTED ||
						target == SoundJS.PLAY_FAILED) {
					replacement = target;

				// Audio is a better candidate than the current target, according to playhead
				} else if (
						(interrupt == SoundJS.INTERRUPT_EARLY && target.getPosition() < replacement.getPosition()) ||
						(interrupt == SoundJS.INTERRUPT_LATE && target.getPosition() > replacement.getPosition())) {
					replacement = target;
				}
			}

			if (replacement != null) {
				replacement.interrupt();
				this.remove(replacement);
				return true;
			}
			return false;
		},

		toString: function() {
			return "[SoundJS SoundChannel]";
		}

	}

	// The SoundChannel is not added to Window


	/**
	 * An additional module to detemermine the current browser, version, operating system, and other environment variables.
	 */
	function BrowserDetect() {}

	BrowserDetect.init = function() {
		var agent = navigator.userAgent;
		BrowserDetect.isFirefox = (agent.indexOf("Firefox")> -1);
		BrowserDetect.isOpera = (window.opera != null);
		BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
	}

	BrowserDetect.init();

	SoundJS.BrowserDetect = BrowserDetect;

}(window));