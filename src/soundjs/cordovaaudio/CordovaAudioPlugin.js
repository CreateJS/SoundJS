/*
 * CordovaAudioPlugin
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
this.createjs = this.createjs || {};

(function () {

	"use strict";

	/**
	 * Play sounds using Cordova Media plugin, which will work with a Cordova app and tools that utilize Cordova such as PhoneGap or Ionic.
	 * This plugin is not used by default, and must be registered manually in {{#crossLink "Sound"}}{{/crossLink}}
	 * using the {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method.
	 * This plugin is recommended when building a Cordova based app, but is not required.
	 *
	 * <b>NOTE the <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Cordova Media plugin</a> is required</b>
	 *
	 * 		cordova plugin add org.apache.cordova.media
	 *
	 * <h4>Known Issues</h4>
	 * <b>Audio Position</b>
	 * <ul>Audio position is calculated asynchronusly by Media.  The SoundJS solution to this problem is two-fold:
	 * <li>Provide {{#crossLink "CordovaAudioSoundInstance/getCurrentPosition"}}{{/crossLink}} that maps directly to media.getCurrentPosition.</li>
	 * <li>Provide a best guess position based on elapsed time since playback started, which is synchronized with actual position when the audio is paused or stopped.
	 * Testing showed this to be fairly reliable within 200ms.</li></ul>
	 * <b>Cordova Media Docs</b>
	 * <ul><li>See the <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Cordova Media Docs</a> for various known OS issues.</li></ul>
	 * <br />
	 *
	 * @class CordovaAudioPlugin
	 * @extends AbstractPlugin
	 * @constructor
	 */
	function CordovaAudioPlugin() {
		this.AbstractPlugin_constructor();

		this._capabilities = s._capabilities;

		this._loaderClass = createjs.CordovaAudioLoader;
		this._soundInstanceClass = createjs.CordovaAudioSoundInstance;

		this._srcDurationHash = {};
	}

	var p = createjs.extend(CordovaAudioPlugin, createjs.AbstractPlugin);
	var s = CordovaAudioPlugin;


// Static Properties
	/**
	 * Sets a default playAudioWhenScreenIsLocked property for play calls on iOS devices.
	 * Individual SoundInstances can alter the default with {{#crossLink "CordovaAudioSoundInstance/playWhenScreenLocked"}}{{/crossLink}}.
	 * @property playWhenScreenLocked
	 * @type {boolean}
	 * @static
	 */
	s.playWhenScreenLocked = false;

	/**
	 * The capabilities of the plugin. This is generated via the {{#crossLink "CordovaAudioPlugin/_generateCapabilities"}}{{/crossLink}}
	 * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for an overview of all
	 * of the available properties.
	 * @property _capabilities
	 * @type {Object}
	 * @protected
	 * @static
	 */
	s._capabilities = null;


// Static Methods
	/**
	 * Determine if the plugin can be used in the current browser/OS. Note that HTML audio is available in most modern
	 * browsers, but is disabled in iOS because of its limitations.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		s._generateCapabilities();
		return (s._capabilities != null);
	};

	/**
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method _generateCapabilities
	 * @static
	 * @protected
	 */
	s._generateCapabilities = function () {
		if (s._capabilities != null || !(window.cordova || window.PhoneGap || window.phonegap) || !window.Media) {return;}

		// OJR my best guess is that Cordova will have the same limits on playback that the audio tag has, but this could be wrong
		var t = document.createElement("audio");
		if (t.canPlayType == null) {return null;}

		s._capabilities = {
			panning:false,
			volume:true,
			tracks:-1
		};

		// determine which extensions our browser supports for this plugin by iterating through Sound.SUPPORTED_EXTENSIONS
		var supportedExtensions = createjs.Sound.SUPPORTED_EXTENSIONS;
		var extensionMap = createjs.Sound.EXTENSION_MAP;
		for (var i = 0, l = supportedExtensions.length; i < l; i++) {
			var ext = supportedExtensions[i];
			var playType = extensionMap[ext] || ext;
			s._capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
		}  // OJR another way to do this might be canPlayType:"m4a", codex: mp4
	};


// public methods
	p.create = function (src, startTime, duration) {
		var si = this.AbstractPlugin_create(src, startTime, duration);
		si.playWhenScreenLocked = this.playWhenScreenLocked;
		return si;
	};

	p.toString = function () {
		return "[CordovaAudioPlugin]";
	};

	// plugin does not support these
	p.setVolume = p.getVolume = p.setMute = null;

	/**
	 * Get the duration for a src.  Intended for internal use by CordovaAudioSoundInstance.
	 * @method getSrcDuration
	 * @param src
	 * @returns {Number} The duration of the src or null if it does not exist
	 */
	p.getSrcDuration = function(src) {
		return this._srcDurationHash[src];
	};

// Private Methods
	p._handlePreloadComplete = function (event) {
		var src = event.target.getItem().src;
		this._srcDurationHash[src] = event.result;
		this._audioSources[src] = event.result;
		//this.AbstractPlugin__handlePreloadComplete(event);	// we don't want to do the rest of this
	};

	p.removeSound = function (src) {
		delete(this._srcDurationHash[src]);
		this.AbstractPlugin_removeSound(src);
	};

	createjs.CordovaAudioPlugin = createjs.promote(CordovaAudioPlugin, "AbstractPlugin");
}());
