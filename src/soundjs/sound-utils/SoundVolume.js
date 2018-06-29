// TODO remove SoundVolume from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundVolume = (function () {

	var SOUND_MIN = 0,
		SOUND_MAX = 1;

	var _soundPlugin = null,
		_soundInstance = null;

	var _masterVolume = 1,
		_masterMute = false;

    var SoundVolume = function (soundPlugin, soundInstance) {
		_soundPlugin = soundPlugin;
		_soundInstance = soundInstance
	};

	var prototype = SoundVolume.prototype;
	prototype.constructor = SoundVolume;
	
	// @deprecated Remove for 1.1+
	prototype.getVolume = createjs.deprecate(_getMasterVolume, "SoundVolume.getVolume");
	prototype.setVolume = createjs.deprecate(_setMasterVolume, "SoundVolume.setVolume");

	prototype.getMute = createjs.deprecate(_getMute, "SoundVolume.getMute");
	prototype.setMute = createjs.deprecate(_setMute, "SoundVolume.setMute");

	prototype.getCapabilities = createjs.deprecate(_getCapabilities, "SoundVolume.getCapabilities");

	Object.defineProperties(prototype, {
		volume: { get: _getMasterVolume, set: _setMasterVolume },
		muted: { get: _getMute, set: _setMute },
		capabilities: { get: _getCapabilities }
	});

    return SoundVolume;

    function _getMasterVolume() {
		return this._masterVolume;
	}

    function _setMasterVolume(value) {
		if (isNaN(value)) {
			return;
		}

		_masterVolume = adjustMasterVolumeToLimit(value);

		var activePlugin = _soundPlugin.activePlugin;

		if (!activePlugin || !activePlugin.setVolume || !activePlugin.setVolume(value)) {
			var instances = _soundInstance.instances;
			for (var i = 0, l = instances.length; i < l; i++) {
				instances[i].setMasterVolume(value);
			}
		}
	}

	function adjustMasterVolumeToLimit(value) {
		return Math.max(SOUND_MIN, Math.min(SOUND_MAX, value));
	}

	function _getMute () {
		return this._masterMute;
	}

    function _setMute (value) {
		if (value == null) {
			return;
		}

		_masterMute = value;

		var activePlugin = _soundPlugin.activePlugin;
		if (!activePlugin || !activePlugin.setMute || !activePlugin.setMute(value)) {
			var instances = _soundInstance.instances;
			for (var i = 0, l = instances.length; i < l; i++) {
				instances[i].setMasterMute(value);
			}
		}
	}

    function _getCapabilities() {
		var activePlugin = _soundPlugin.activePlugin;
		if (activePlugin == null) {
			return null;
		}
		return activePlugin.capabilities;
	}
});