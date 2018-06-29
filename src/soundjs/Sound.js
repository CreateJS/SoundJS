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

// Static Properties
	Sound.INTERRUPT_ANY = InterruptMode.INTERRUPT_ANY;
	Sound.INTERRUPT_EARLY = InterruptMode.INTERRUPT_EARLY;
	Sound.INTERRUPT_LATE = InterruptMode.INTERRUPT_LATE;
	Sound.INTERRUPT_NONE = InterruptMode.INTERRUPT_NONE;

	Sound.PLAY_INITED = PlayState.PLAY_INITED;
	Sound.PLAY_SUCCEEDED = PlayState.PLAY_SUCCEEDED;
	Sound.PLAY_INTERRUPTED = PlayState.PLAY_INTERRUPTED;
	Sound.PLAY_FINISHED = PlayState.PLAY_FINISHED;
	Sound.PLAY_FAILED = PlayState.PLAY_FAILED;

	Sound.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "opus", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];

	Sound.EXTENSION_MAP = {
		m4a:"mp4"
	};

	Sound.FILE_PATTERN = SoundParser.FILE_PATTERN;

// class getter / setter properties
	
	Sound.getVolume = _soundVolume.getVolume;
	Sound.setVolume = _soundVolume.setVolume;
	Sound.getMute = _soundVolume.getMute;
	Sound.setMute = _soundVolume.setMute;
	Sound.getCapabilities = _soundVolume.getCapabilities;

	Object.defineProperties(s, {
		volume: { get: _getMasterVolume, set: _setMasterVolume },
		muted: { get: _getMute, set: _setMute },
		capabilities: { get: _getCapabilities },
		defaultInterruptBehavior: { get: _getDefaultInterruptBehavior, set: _setDefaultInterruptBehavior },
		alternateExtensions: { get: _getAlternateExtensions, set: _setAlternateExtensions },
		activePlugin: { get: _getActivePlugin, set: _setActivePlugin }
	});


// EventDispatcher methods:
	Sound.addEventListener = _soundEventHandler.addEventListener;
	Sound.removeEventListener = _soundEventHandler.removeEventListener;
	Sound.removeAllEventListeners = _soundEventHandler.removeAllEventListeners;
	Sound.dispatchEvent = _soundEventHandler.dispatchEvent;
	Sound.hasEventListener = _soundEventHandler.hasEventListener;
	Sound._listeners = _soundEventHandler._listeners;

// Class Public Methods
	Sound.getPreloadHandlers = getPreloadHandlers;
	Sound.registerPlugins = _soundPlugin.registerPlugins;
	Sound.initializeDefaultPlugins = _soundPlugin.initializeDefaultPlugins;
	Sound.isReady = _soundPlugin.isReady;
	Sound.initLoad = _soundRegister.initLoad;
	Sound.registerSound = _soundRegister.registerSound;
	Sound.registerSounds = _soundRegister.registerSounds;
	Sound.removeSound = _soundRegister.removeSound;
	Sound.removeSounds = _soundRegister.removeSounds;
	Sound.removeAllSounds = _soundRegister.removeAllSounds;
	Sound.loadComplete = _soundRegister.loadComplete;
	Sound.play = _soundInstance.play;
	Sound.createInstance = _soundInstance.createInstance;
	Sound.stop = _soundInstance.setStop;
	Sound.setDefaultPlayProps = _soundRegister.setDefaultPlayProps;
	Sound.getDefaultPlayProps = _soundRegister.getDefaultPlayProps;

	return Sound;

	function getPreloadHandlers() {
		return {
			callback:createjs.proxy(Sound.initLoad, s),
			types:["sound"],
			extensions:Sound.SUPPORTED_EXTENSIONS
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
