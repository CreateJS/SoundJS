// namespace:
this.createjs = this.createjs || {};

createjs.Sound = (function () {
	"use strict";

	var InterruptMode = createjs.metadata.sound.InterruptMode,
		PlayState = createjs.metadata.sound.PlayState,
		SoundParser = createjs.soundUtils.SoundParser,
		SoundFactory = createjs.soundUtils.SoundFactory;

	var _soundPlugin = SoundFactory.getSoundPlugin(),
		_soundVolume = SoundFactory.getSoundVolume(),
		_soundRegister = SoundFactory.getSoundRegister(),
		_soundInstance = SoundFactory.getSoundInstance(),
		_soundParser = SoundFactory.getSoundParser(),
		_soundEventHandler = SoundFactory.getSoundEventHandler();

	function Sound() {
		throw "Sound cannot be instantiated";
	}

	var s = Sound;

// Static Properties
	s.INTERRUPT_ANY = InterruptMode.INTERRUPT_ANY;
	s.INTERRUPT_EARLY = InterruptMode.INTERRUPT_EARLY;
	s.INTERRUPT_LATE = InterruptMode.INTERRUPT_LATE;
	s.INTERRUPT_NONE = InterruptMode.INTERRUPT_NONE;

	s.PLAY_INITED = PlayState.PLAY_INITED;
	s.PLAY_SUCCEEDED = PlayState.PLAY_SUCCEEDED;
	s.PLAY_INTERRUPTED = PlayState.PLAY_INTERRUPTED;
	s.PLAY_FINISHED = PlayState.PLAY_FINISHED;
	s.PLAY_FAILED = PlayState.PLAY_FAILED;

	s.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "opus", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];

	s.EXTENSION_MAP = {
		m4a:"mp4"
	};

	s.FILE_PATTERN = SoundParser.FILE_PATTERN;

// class getter / setter properties
	
	s.getVolume = _soundVolume.getVolume;
	s.setVolume = _soundVolume.setVolume;
	s.getMute = _soundVolume.getMute;
	s.setMute = _soundVolume.setMute;
	s.getCapabilities = _soundVolume.getCapabilities;

	Object.defineProperties(s, {
		volume: { get: _getMasterVolume, set: _setMasterVolume },
		muted: { get: _getMute, set: _setMute },
		capabilities: { get: _getCapabilities },
		defaultInterruptBehavior: { get: _getDefaultInterruptBehavior, set: _setDefaultInterruptBehavior },
		alternateExtensions: { get: _getAlternateExtensions, set: _setAlternateExtensions },
		activePlugin: { get: _getActivePlugin, set: _setActivePlugin }
	});


// EventDispatcher methods:
	s.addEventListener = _soundEventHandler.addEventListener;
	s.removeEventListener = _soundEventHandler.removeEventListener;
	s.removeAllEventListeners = _soundEventHandler.removeAllEventListeners;
	s.dispatchEvent = _soundEventHandler.dispatchEvent;
	s.hasEventListener = _soundEventHandler.hasEventListener;
	s._listeners = _soundEventHandler._listeners;

// Class Public Methods
	s.getPreloadHandlers = getPreloadHandlers;
	s.registerPlugins = _soundPlugin.registerPlugins;
	s.initializeDefaultPlugins = _soundPlugin.initializeDefaultPlugins;
	s.isReady = _soundPlugin.isReady;
	s.initLoad = _soundRegister.initLoad;
	s.registerSound = _soundRegister.registerSound;
	s.registerSounds = _soundRegister.registerSounds;
	s.removeSound = _soundRegister.removeSound;
	s.removeSounds = _soundRegister.removeSounds;
	s.removeAllSounds = _soundRegister.removeAllSounds;
	s.loadComplete = _soundRegister.loadComplete;
	s.play = _soundInstance.play;
	s.createInstance = _soundInstance.createInstance;
	s.stop = _soundInstance.setStop;
	s.setDefaultPlayProps = _soundRegister.setDefaultPlayProps;
	s.getDefaultPlayProps = _soundRegister.getDefaultPlayProps;

	return Sound;

	function getPreloadHandlers() {
		return {
			callback:createjs.proxy(s.initLoad, s),
			types:["sound"],
			extensions:s.SUPPORTED_EXTENSIONS
		};
	}

	function _getMasterVolume() {
		return _soundVolume.volume;
	}

	function _setMasterVolume(value) {
		_soundVolume.volume = value;
	}

	function _getMute() {
		return _soundVolume.muted;
	}

	function _setMute(value) {
		_soundVolume.muted = value;
	}

	function _getCapabilities() {
		return _soundVolume.capabilities;
	}

	function _getDefaultInterruptBehavior() {
		return _soundInstance.defaultInterruptBehavior;
	}

	function _setDefaultInterruptBehavior(value) {
		_soundInstance.defaultInterruptBehavior = value;
	}

	function _getAlternateExtensions() {
		return _soundParser.alternateExtensions;
	}

	function _setAlternateExtensions(value) {
		_soundParser.alternateExtensions = value;
	}

	function _getActivePlugin() {
		return _soundPlugin.activePlugin;
	}

	function _setActivePlugin(value) {
		_soundPlugin.activePlugin = value;
	}

}());
