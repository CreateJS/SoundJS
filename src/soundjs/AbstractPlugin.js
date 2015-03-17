/*
 * AbstractPlugin
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

// namespace:
this.createjs = this.createjs || {};

(function () {
	"use strict";


// constructor:
 	/**
	 * A default plugin class used as a base for all other plugins.
	 * @class AbstractPlugin
	 * @constructor
	 * @since 0.6.0
	 */

	var AbstractPlugin = function () {
	// private properties:
		/**
		 * The capabilities of the plugin.
		 * method and is used internally.
		 * @property _capabilities
		 * @type {Object}
		 * @default null
		 * @protected
		 * @static
		 */
		this._capabilities = null;

		/**
		 * Object hash indexed by the source URI of all created loaders, used to properly destroy them if sources are removed.
		 * @type {Object}
		 * @protected
		 */
		this._loaders = {};

		/**
		 * Object hash indexed by the source URI of each file to indicate if an audio source has begun loading,
		 * is currently loading, or has completed loading.  Can be used to store non boolean data after loading
		 * is complete (for example arrayBuffers for web audio).
		 * @property _audioSources
		 * @type {Object}
		 * @protected
		 */
		this._audioSources = {};

		/**
		 * Object hash indexed by the source URI of all created SoundInstances, updates the playbackResource if it loads after they are created,
		 * and properly destroy them if sources are removed
		 * @type {Object}
		 * @protected
		 */
		this._soundInstances = {};

		/**
		 * A reference to a loader class used by a plugin that must be set.
		 * @type {Object}
		 * @protected
		 */
		this._loaderClass;

		/**
		 * A reference to an AbstractSoundInstance class used by a plugin that must be set.
		 * @type {Object}
		 * @protected;
		 */
		this._soundInstanceClass;
	};
	var p = AbstractPlugin.prototype;

	/**
	 * <strong>REMOVED</strong>. Removed in favor of using `MySuperClass_constructor`.
	 * See {{#crossLink "Utility Methods/extend"}}{{/crossLink}} and {{#crossLink "Utility Methods/promote"}}{{/crossLink}}
	 * for details.
	 *
	 * There is an inheritance tutorial distributed with EaselJS in /tutorials/Inheritance.
	 *
	 * @method initialize
	 * @protected
	 * @deprecated
	 */
	// p.initialize = function() {}; // searchable for devs wondering where it is.


// Static Properties:
// NOTE THESE PROPERTIES NEED TO BE ADDED TO EACH PLUGIN
	/**
	 * The capabilities of the plugin. This is generated via the _generateCapabilities method and is used internally.
	 * @property _capabilities
	 * @type {Object}
	 * @default null
	 * @protected
	 * @static
	 */
	AbstractPlugin._capabilities = null;

	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	AbstractPlugin.isSupported = function () {
		return true;
	};


// public methods:
	/**
	 * Pre-register a sound for preloading and setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
	 * Note all plugins provide a <code>Loader</code> instance, which <a href="http://preloadjs.com" target="_blank">PreloadJS</a>
	 * can use to assist with preloading.
	 * @method register
	 * @param {String} loadItem An Object containing the source of the audio
	 * Note that not every plugin will manage this value.
	 * @return {Object} A result object, containing a "tag" for preloading purposes.
	 */
	p.register = function (loadItem) {
		var loader = this._loaders[loadItem.src];
		if(loader && !loader.canceled) {return this._loaders[loadItem.src];}	// already loading/loaded this, so don't load twice
		// OJR potential issue that we won't be firing loaded event, might need to trigger if this is already loaded?
		this._audioSources[loadItem.src] = true;
		this._soundInstances[loadItem.src] = [];
		loader = new this._loaderClass(loadItem);
		loader.on("complete", createjs.proxy(this._handlePreloadComplete, this));
		this._loaders[loadItem.src] = loader;
		return loader;
	};

	// note sound calls register before calling preload
	/**
	 * Internally preload a sound.
	 * @method preload
	 * @param {Loader} loader The sound URI to load.
	 */
	p.preload = function (loader) {
		loader.on("error", createjs.proxy(this._handlePreloadError, this));
		loader.load();
	};

	/**
	 * Checks if preloading has started for a specific source. If the source is found, we can assume it is loading,
	 * or has already finished loading.
	 * @method isPreloadStarted
	 * @param {String} src The sound URI to check.
	 * @return {Boolean}
	 */
	p.isPreloadStarted = function (src) {
		return (this._audioSources[src] != null);
	};

	/**
	 * Checks if preloading has finished for a specific source.
	 * @method isPreloadComplete
	 * @param {String} src The sound URI to load.
	 * @return {Boolean}
	 */
	p.isPreloadComplete = function (src) {
		return (!(this._audioSources[src] == null || this._audioSources[src] == true));
	};

	/**
	 * Remove a sound added using {{#crossLink "WebAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
	 * @method removeSound
	 * @param {String} src The sound URI to unload.
	 */
	p.removeSound = function (src) {
		if (!this._soundInstances[src]) { return; }
		for (var i = this._soundInstances[src].length; i--; ) {
			var item = this._soundInstances[src][i];
			item.destroy();
		}
		delete(this._soundInstances[src]);
		delete(this._audioSources[src]);
		if(this._loaders[src]) { this._loaders[src].destroy(); }
		delete(this._loaders[src]);
	};

	/**
	 * Remove all sounds added using {{#crossLink "WebAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
	 * @method removeAllSounds
	 * @param {String} src The sound URI to unload.
	 */
	p.removeAllSounds = function () {
		for(var key in this._audioSources) {
			this.removeSound(key);
		}
	};

	/**
	 * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
	 * @method create
	 * @param {String} src The sound source to use.
	 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
	 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
	 * @return {AbstractSoundInstance} A sound instance for playback and control.
	 */
	p.create = function (src, startTime, duration) {
		if (!this.isPreloadStarted(src)) {
			this.preload(this.register(src));
		}
		var si = new this._soundInstanceClass(src, startTime, duration, this._audioSources[src]);
		this._soundInstances[src].push(si);
		return si;
	};

	// if a plugin does not support volume and mute, it should set these to null
	/**
	 * Set the master volume of the plugin, which affects all SoundInstances.
	 * @method setVolume
	 * @param {Number} value The volume to set, between 0 and 1.
	 * @return {Boolean} If the plugin processes the setVolume call (true). The Sound class will affect all the
	 * instances manually otherwise.
	 */
	p.setVolume = function (value) {
		this._volume = value;
		this._updateVolume();
		return true;
	};

	/**
	 * Get the master volume of the plugin, which affects all SoundInstances.
	 * @method getVolume
	 * @return {Number} The volume level, between 0 and 1.
	 */
	p.getVolume = function () {
		return this._volume;
	};

	/**
	 * Mute all sounds via the plugin.
	 * @method setMute
	 * @param {Boolean} value If all sound should be muted or not. Note that plugin-level muting just looks up
	 * the mute value of Sound {{#crossLink "Sound/getMute"}}{{/crossLink}}, so this property is not used here.
	 * @return {Boolean} If the mute call succeeds.
	 */
	p.setMute = function (value) {
		this._updateVolume();
		return true;
	};

	// plugins should overwrite this method
	p.toString = function () {
		return "[AbstractPlugin]";
	};


// private methods:
	/**
	 * Handles internal preload completion.
	 * @method _handlePreloadComplete
	 * @protected
	 */
	p._handlePreloadComplete = function (event) {
		var src = event.target.getItem().src;
		this._audioSources[src] = event.result;
		for (var i = 0, l = this._soundInstances[src].length; i < l; i++) {
			var item = this._soundInstances[src][i];
			item.setPlaybackResource(this._audioSources[src]);
			// ToDo consider adding play call here if playstate == playfailed
		}
	};

	/**
	 * Handles internal preload erros
	 * @method _handlePreloadError
	 * @param event
	 * @protected
	 */
	p._handlePreloadError = function(event) {
		//delete(this._audioSources[src]);
	};

	/**
	 * Set the gain value for master audio. Should not be called externally.
	 * @method _updateVolume
	 * @protected
	 */
	p._updateVolume = function () {
		// Plugin Specific code
	};

	createjs.AbstractPlugin = AbstractPlugin;
}());
