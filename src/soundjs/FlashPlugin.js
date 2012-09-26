/*
* FlashPlugin for SoundJS
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
 * @module SoundJS
 */

// namespace:
this.createjs = this.createjs||{};

(function() {

	/**
	 * Play sounds using a Flash instance. This plugin requires swfObject.as
	 * as well as the FlashAudioPlugin.swf. Ensure that FlashPlugin.BASE_PATH
	 * is set when using this plugin, so that the script can find the swf.
	 * @class FlashPlugin
	 * @constructor
	 */
	function FlashPlugin() {
		this.init();
	}

	var s = FlashPlugin;

	/**
	 * The capabilities of the plugin.
	 * @property capabilities
	 * @type Object
	 * @default null
	 * @static
	 */
	s.capabilities = null;

	/**
	 * The path relative to the HTML page that the FlashAudioPlugin.swf resides.
	 * If this is not correct, this plugin will not work.
	 * @property BASE_PATH
	 * @type String
	 * @default src/soundjs
	 * @static
	 */
	s.BASE_PATH = "src/soundjs/";

	// Protected static
	s.lastId = 0;

	/**
	 * Determine if the plugin can be used.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function() {
		if (createjs.SoundJS.BrowserDetect.isIOS) { return false; }
		s.generateCapabilities();
		if (swfobject == null) {
			return false;
		}
		return swfobject.hasFlashPlayerVersion("9.0.0");
		//TODO: Internal detection instead of SWFObject
	};

	/**
	 * Determine the capabilities of the plugin.
	 * @method generateCapabiities
	 * @static
	 */
	s.generateCapabilities = function() {
		if (s.capabilities != null) { return; }
		var c = s.capabilities = {
			panning: true,
			volume: true,
			mp3: true,
			ogg: false,
			mpeg: true,
			wav: true,
			channels: 255 //TODO: Determine flash limit
		};
		//TODO: Other Props
    };


	var p = s.prototype = {

		CONTAINER_ID: "flashAudioContainer",
		capabilities: null,

		// FlashPlugin Specifics
		container: null, // Reference to the DIV containing the Flash Player
		flash: null, // Reference to the flash player instance
		flashReady: false,
		flashInstances: null, // Hash of flashSoundInstances by Flash ID
		flashPreloadInstances: null, // Hash of preload instances, by Flash ID
		queuedInstances: null,

		/**
		 * A developer flag to output all flash events to the console.
		 * @property showOutput
		 * @type Boolean
		 * @default false
		 */
		showOutput: false,

		init: function() {

			this.capabilities = s.capabilities;

			this.flashInstances = {};
			this.flashPreloadInstances = {};
			this.queuedInstances = [];

			// Create DIV
			var c = this.container = document.createElement("div");
			c.id = this.CONTAINER_ID;
			c.appendChild(document.createTextNode("Default Content Here"));
			document.body.appendChild(c);

			// Embed SWF
			var val = swfobject.embedSWF(s.BASE_PATH + "FlashAudioPlugin.swf", this.CONTAINER_ID, "1", "1",//550", "400",
					"9.0.0",null,null,null,null,
					createjs.SoundJS.proxy(this.handleSWFReady, this)
			);

			//TODO: Internal detection instead of swfobject
		},

		handleSWFReady: function(e) {
			this.flash = e.ref;

			//TODO: Confirm that any instances that are asked to be preloaded before this are queued until Flash is ready.
			this.loadTimeout = setTimeout(function() {
				createjs.SoundJS.proxy(this.handleTimeout, this);
			}, 2000);
		},

		handleFlashReady: function() {
			this.flashReady = true;

			// Anything that needed to be preloaded, can now do so.
			for (var i=0, l=this.queuedInstances.length; i<l; i++) {
				this.flash.register(this.queuedInstances[i]);
			}
			this.queuedInstances = null;

			// Associate flash instance with any preloadInstance that already exists.
			for (var n in this.flashPreloadInstances) {
				this.flashPreloadInstances[n].initialize(this.flash);
			}

			// Associate flash instance with any sound instance that has already been played.
			for (var n in this.flashInstances) {
				this.flashInstances[n].initialize(this.flash);
			}
		},

		handleTimeout: function() {
			//TODO: Surface to user?
			//LM: Maybe SoundJS.handleError(error); ???
		},

		/**
		 * Pre-register a sound instance when preloading/setup.
		 * Note that the FlashPlugin will return a SoundLoader instance for preloading
		 * since Flash can not access the browser cache consistently.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register: function(src, instances) {
			if (!this.flashReady) {
				// Queue
				this.queuedInstances.push(src);
			} else {
				this.flash.register(src);
			}
			var tag = new SoundLoader(src, this.flash);
			tag.owner = this;
			return {
				tag: tag
			};
		},

		/**
		 * Create a sound instance.
		 * @method create
		 * @param {String} src The source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create: function(src) {
            try {
                var instance = new SoundInstance(src, this.flash);
			    instance.owner = this;
                return instance;
            } catch (err) {
                //console.log("Error: Please ensure you have permission to play audio from this location.", err);
            }
            return null;
		},

	// Flash Communication
		registerPreloadInstance: function(flashId, instance) {
			this.flashPreloadInstances[flashId] = instance;
		},
		unregisterPreloadInstance: function(flashId) {
			delete this.flashPreloadInstances[flashId];
		},

		registerSoundInstance: function(flashId, instance) {
			this.flashInstances[flashId] = instance;
		},
		unregisterSoundInstance: function(flashId) {
			delete this.flashInstances[flashId];
		},
		flashLog: function(data) {
			this.showOutput && console.log(data);
		},

		// Events from Flash pertaining to a specific SoundInstance
		handleSoundEvent: function(flashId, method) {
			var instance = this.flashInstances[flashId];
			if (instance == null) { return; }
			var args = [];
			for (var i=2, l=arguments.length; i<l; i++) { args.push(arguments[i]); }
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch(error) {}
		},

		// Events for Flash pertaining to a specific SoundLoader
		handlePreloadEvent: function(flashId, method) {
			var instance = this.flashPreloadInstances[flashId];
			if (instance == null) { return; }
			var args = [];
			for (var i=2, l=arguments.length; i<l; i++) { args.push(arguments[i]); }
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch(error) {}
		},

		// Events from Flash pertaining to general functions
		handleEvent: function(method) {
			//SoundJS.log("Handle Event", method);
			switch (method) {
				case "ready":
					clearTimeout(this.loadTimeout);
					this.handleFlashReady();
					break;
			}
		},

		// Events from Flash when an error occurs.
        handleErrorEvent: function(error) {},

		toString: function() {
			return "[FlashPlugin]";
		}

	}

	createjs.FlashPlugin = FlashPlugin;


	/**
	 * Flash Sound Instance
	 * Instances are created by the FlashPlugin, and returned to the user.
	 * The user can control the audio directly.
	 * Note that audio control is shuttled to a flash player instance via the flash reference.
	 * @param {String} src The path to the sound source
	 * @param {Object} flash A reference to the Flash Player instance that controls the audio.
	 * @private
	 */
	function SoundInstance(src, flash) {
		this.init(src, flash);
	}

	var p = SoundInstance.prototype = {

		/**
		 * The source of the sound.
		 * @private
		 */
		src: null,

		/**
		 * The unique ID of the instance
		 * @private
		 */
		uniqueId: -1,

		owner: null,
		capabilities: null,
		flash: null,
		flashId: null, // To communicate with Flash

		loop:0,
		volume:1,
		pan:0,

		/**
		 * Determines if the audio is currently muted.
		 * @private
		 */
		muted: false,

		/**
		 * Determines if the audio is currently paused. If the audio has not yet started playing,
		 * it will be true, unless the user pauses it.
		 * @private
		 */
		paused: false,

		/**
		 * The callback that is fired when a sound has completed playback
		 * @event onComplete
		 * @private
		 */
		onComplete: null,

		/**
		 * The callback that is fired when a sound has completed playback, but has loops remaining.
		 * @event onLoop
		 * @private
		 */
		onLoop: null,

		/**
		 * The callback that is fired when a sound is ready to play.
		 * @event onReady
		 * @private
		 */
		onReady: null,

		/**
		 * The callback that is fired when a sound has failed to start.
		 * @event onPlayFailed
		 * @private
		 */
		onPlayFailed: null,

		/**
		 * The callback that is fired when a sound has been interrupted.
		 * @event onPlayInterrupted
		 * @private
		 */
		onPlayInterrupted: null,

		init: function(src, flash) {
			this.uniqueId = s.lastId++;
			this.src = src;
			this.flash = flash;
		},

		initialize: function(flash) {
			this.flash = flash;
		},

	// Public API

		interrupt: function() {
			this.playState = createjs.SoundJS.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted != null) { this.onPlayInterrupted(this); }
			this.flash.interrupt(this.flashId);
			this.cleanUp();
		},

		cleanUp: function() {
			this.owner.unregisterSoundInstance(this.flashId);
			createjs.SoundJS.playFinished(this);
		},

		/**
		 * Play an instance. This API is only used to play an instance after it has been stopped
		 * or interrupted.
		 * @private
		 */
		play: function(interrupt, delay, offset, loop, volume, pan) {
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		beginPlaying: function(offset, loop, volume, pan) {
			this.loop = loop;
			this.paused = false;

			if (!this.owner.flashReady) { return false; }

            this.flashId = this.flash.playSound(this.src, offset, loop, volume, pan);
			if (this.flashId == null) {
				if (this.onPlayFailed != null) { this.onPlayFailed(this); }
				this.cleanUp();
				return false;
			}
			if (this.muted) { this.mute(true); }
			this.playState = createjs.SoundJS.PLAY_SUCCEEDED;
			this.owner.registerSoundInstance(this.flashId, this);
			return true;
		},

		playFailed: function() {
			this.playState = createjs.SoundJS.PLAY_FAILED;
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
			this.cleanUp();
		},

		/**
		 * Pause the instance.
		 * @private
		 */
		pause: function() {
			this.paused = true;
			return this.flash.pauseSound(this.flashId);
		},

		/**
		 * Resume a sound instance that has been paused.
		 * @private
		 */
		resume: function() {
			this.paused = false;
			return this.flash.resumeSound(this.flashId);
		},

		/**
		 * Stop a sound instance.
		 * @private
		 */
		stop: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			this.paused = false;
			var ok = this.flash.stopSound(this.flashId);
			this.cleanUp();
			return ok;
		},

		/**
		 * Set the volume of the sound instance.
		 * @private
		 */
		setVolume: function(value) {
			this.volume = value;
			return this.flash.setVolume(this.flashId, value)
		},

		/**
		 * Get the volume of the sound, not including how the master volume has affected it.
		 * @private
		 */
		getVolume: function() {
			return this.volume;
		},

		/**
		 * Mute the sound.
		 * @private
		 */
		mute: function(value) {
			this.muted = value;
			return value ? this.flash.muteSound(this.flashId) : this.flash.unmuteSound(this.flashId);
		},

		/**
		 * Get the pan of a sound instance.
		 * @private
		 */
		getPan: function() {
			return this.pan;
		},

		/**
		 * Set the pan of a sound instance.
		 * @private
		 */
		setPan: function(value) {
			this.pan = value;
			return this.flash.setPan(this.flashId, value);
		},

		/**
		 * Get the position of the playhead in the sound instance.
		 * @private
		 */
		getPosition: function() {
			return this.flash.getPosition(this.flashId);
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @private
		 */
		setPosition: function(value) {
			return this.flash && this.flash.setPosition(this.flashId, value);
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @private
		 */
		getDuration: function() {
			return this.flash ? 0 : this.flash.getDuration(this.flashId);
		},

	// Flash callbacks
		handleSoundFinished: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			if (this.onComplete != null) { this.onComplete(this); }
			this.cleanUp();
		},

		handleLoop: function() {
			if (this.onLoop != null) { this.onLoop(this); }
		},

		toString: function() {
			return "[FlashPlugin SoundInstance]"
		}

	}

	// do not add to namespace


	/**
	 * SoundLoader provides a mechanism to preload Flash content via PreloadJS.
	 * Instances are returned to the preloader, and the load method is called when
	 * the asset needs to be requested.
	 *
	 * SoundLoader has the same APIs as an <audio> tag.
	 * The instance calls the onloaded, onprogress, and onerror callbacks when necessary.
	 * @class SoundLoader
	 * @param {String} src The path to the sound
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @private
	 */
	function SoundLoader(src, flash) {
		this.init(src, flash);
	}

	var p = SoundLoader.prototype = {

		flash:null,
		src: null,

		flashId: null,
		progress: -1,
		readyState: 0,
		loading: false,
		owner: null,

		// Calbacks
		/**
		 * The callback that fires when the load completes. This follows HTML tag naming.
		 * @event onload
		 * @private
		 */
		onload: null,

		/**
		 * The callback that fires as the load progresses. This follows HTML tag naming.
		 * @event onprogress
		 * @private
		 */
		onprogress: null,

		/**
		 * The callback that fires if the load hits an error.
		 * @event onerror
		 * @private
		 */
		onError: null,

		// The loader has been created.
		init: function(src, flash) {
			this.src = src;
			this.flash = flash;
		},

		// Flash has been initialized. If a load call was made before this, call it now.
		initialize: function(flash) {
			this.flash = flash;
			if (this.loading) {
				this.load(this.src);
			}
		},

		/**
		 * Start loading.
		 * @param {String} src The path to the sound.
		 * @return {Boolean} If the load was started. If Flash has not been initialized, the load will fail.
		 * @private
		 */
		load: function(src) {
			if (src != null) { this.src = src; }
			if (this.flash == null || !this.owner.flashReady) {
				loading = true;
				return false;
			}

			this.flashId = this.flash.preload(this.src);
			// Associate this preload instance with the FlashID, so callbacks can route here.
			this.owner.registerPreloadInstance(this.flashId, this);
			return true;
		},

		handleProgress: function(loaded, total) {
			this.progress = loaded / total;
			if (this.onprogress == null) { return; }
			this.onprogress({loaded:loaded, total:total, progress:this.progress});
		},

		handleComplete: function() {
			this.progress = 1;
			this.readyState = 4;
			if (this.onload == null) { return; }
			this.onload();
		},

		handleError: function(error) {
			if (this.onerror == null) { return; }
			this.onerror(error);
		},

		toString: function() {
			return "[FlashPlugin SoundLoader]";
		}

		// do not add to namespace

	}

}());