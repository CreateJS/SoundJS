// TODO remove SoundRegister from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundRegister = (function () {

	var _soundEventHandler = null,
		_soundPlugin = null,
		_soundParser = null;

	var _idHash = {},
		_preloadHash = {};

    var SoundRegister = function (soundEventHandler, soundPlugin, soundParser) {
		_soundEventHandler = soundEventHandler;
		_soundPlugin = soundPlugin;
		_soundParser = soundParser;

		this.defaultPlayPropsHash = null;
	};
    
	var prototype = SoundRegister.prototype;
	prototype.constructor = SoundRegister;

	prototype.initLoad = initLoad;
	prototype.registerSound = registerSound;
	prototype.registerSounds = registerSounds;
	prototype.removeSound = removeSound;
	prototype.removeSounds = removeSounds;
	prototype.removeAllSounds = removeAllSounds;
	prototype.loadComplete = loadComplete;
	prototype.setDefaultPlayProps = setDefaultPlayProps;
	prototype.getDefaultPlayProps = getDefaultPlayProps;
	prototype.getSrcById = _getSrcById;

    return SoundRegister;

	function initLoad(loadItem) {
		if (loadItem.type == "video") { return true; } // Don't handle video. PreloadJS's plugin model is really aggressive.
		return _registerSound(loadItem);
	}

	function registerSound(src, id, data, basePath, defaultPlayProps) {
		var loadItem = {src: src, id: id, data:data, defaultPlayProps:defaultPlayProps};
		if (src instanceof Object && src.src) {
			basePath = id;
			loadItem = src;
		}
		loadItem = createjs.LoadItem.create(loadItem);
		loadItem.path = basePath;

		if (basePath != null && !(loadItem.src instanceof Object)) {loadItem.src = basePath + loadItem.src;}

		var loader = _registerSound(loadItem);
		if(!loader) {return false;}

		if (!_preloadHash[loadItem.src]) { _preloadHash[loadItem.src] = []; }
		_preloadHash[loadItem.src].push(loadItem);
		if (_preloadHash[loadItem.src].length == 1) {
			// OJR note this will disallow reloading a sound if loading fails or the source changes
			loader.on("complete", _handleLoadComplete, this);
			loader.on("error", _handleLoadError, this);

			_soundPlugin.activePlugin.preload(loader);
		} else {
			if (_preloadHash[loadItem.src][0] == true) {return true;}
		}

		return loadItem;
	}

	function registerSounds(sounds, basePath) {
		var returnValues = [];
		if (sounds.path) {
			if (!basePath) {
				basePath = sounds.path;
			} else {
				basePath = basePath + sounds.path;
			}
			sounds = sounds.manifest;
			// TODO document this feature
		}
		for (var i = 0, l = sounds.length; i < l; i++) {
			returnValues[i] = createjs.Sound.registerSound(sounds[i].src, sounds[i].id, sounds[i].data, basePath, sounds[i].defaultPlayProps);
		}
		return returnValues;
	}

	function removeSound(src, basePath) {
		if (_soundPlugin.activePlugin == null) {return false;}

		if (src instanceof Object && src.src) {src = src.src;}

		var details;
		if (src instanceof Object) {
			details = _soundParser.parseSrc(src);
		} else {
			src = _getSrcById(src).src;
			details = _soundParser.parsePath(src);
		}
		if (details == null) {return false;}
		src = details.src;
		if (basePath != null) {src = basePath + src;}

		for(var prop in _idHash){
			if(_idHash[prop].src == src) {
				delete(_idHash[prop]);
			}
		}

		// clear from SoundChannel, which also stops and deletes all instances
		SoundChannel.removeSrc(src);

		delete(_preloadHash[src]);

		_soundPlugin.activePlugin.removeSound(src);

		return true;
	}

	function removeSounds(sounds, basePath) {
		var returnValues = [];
		if (sounds.path) {
			if (!basePath) {
				basePath = sounds.path;
			} else {
				basePath = basePath + sounds.path;
			}
			sounds = sounds.manifest;
		}
		for (var i = 0, l = sounds.length; i < l; i++) {
			returnValues[i] = createjs.Sound.removeSound(sounds[i].src, basePath);
		}
		return returnValues;
	}

	function removeAllSounds() {
		_idHash = {};
		_preloadHash = {};
		SoundChannel.removeAll();
		if (_soundPlugin.activePlugin) {
			_soundPlugin.activePlugin.removeAllSounds();
		}
	}

	function loadComplete(src) {
		if (!_soundPlugin.isReady()) { return false; }
		var details = _soundParser.parsePath(src);
		if (details) {
			src = _getSrcById(details.src).src;
		} else {
			src = _getSrcById(src).src;
		}
		if(_preloadHash[src] == undefined) {return false;}
		return (_preloadHash[src][0] == true);  // src only loads once, so if it's true for the first it's true for all
	}

    function _registerSound(loadItem) {
		if (!_soundPlugin.initializeDefaultPlugins()) {return false;}

		var details;
		if (loadItem.src instanceof Object) {
			details = _soundParser.parseSrc(loadItem.src);
			details.src = loadItem.path + details.src;
		} else {
			details = _soundParser.parsePath(loadItem.src);
		}
		if (details == null) {return false;}
		loadItem.src = details.src;
		loadItem.type = "sound";

		var data = loadItem.data;
		var numChannels = null;
		if (data != null) {
			if (!isNaN(data.channels)) {
				numChannels = parseInt(data.channels);
			} else if (!isNaN(data)) {
				numChannels = parseInt(data);
			}

			if(data.audioSprite) {
				var sp;
				for(var i = data.audioSprite.length; i--; ) {
					sp = data.audioSprite[i];
					_idHash[sp.id] = {src: loadItem.src, startTime: parseInt(sp.startTime), duration: parseInt(sp.duration)};

					if (sp.defaultPlayProps) {
						this.defaultPlayPropsHash[sp.id] = createjs.PlayPropsConfig.create(sp.defaultPlayProps);
					}
				}
			}
		}
		if (loadItem.id != null) {_idHash[loadItem.id] = {src: loadItem.src}};
		var loader = _soundPlugin.activePlugin.register(loadItem);

		SoundChannel.create(loadItem.src, numChannels);

		// return the number of instances to the user.  This will also be returned in the load event.
		if (data == null || !isNaN(data)) {
			loadItem.data = numChannels || SoundChannel.maxPerChannel();
		} else {
			loadItem.data.channels = numChannels || SoundChannel.maxPerChannel();
		}

		if (loader.type) {loadItem.type = loader.type;}

		if (loadItem.defaultPlayProps) {
			this.defaultPlayPropsHash[loadItem.src] = createjs.PlayPropsConfig.create(loadItem.defaultPlayProps);
		}
		return loader;
	}

	function setDefaultPlayProps(src, playProps) {
		src = _getSrcById(src);
		this.defaultPlayPropsHash[_soundParser.parsePath(src.src).src] = createjs.PlayPropsConfig.create(playProps);
	}

	function getDefaultPlayProps(src) {
		src = _getSrcById(src);
		return this.defaultPlayPropsHash[_soundParser.parsePath(src.src).src];
	}

    function _getSrcById(value) {
        return _idHash[value] || { src: value };
	}
	
	function _handleLoadComplete(event) {
		_soundEventHandler.handleLoadComplete(event, _preloadHash);
	}

	function _handleLoadError(event) {
		_soundEventHandler.handleLoadError(event, _preloadHash);
	}
})();