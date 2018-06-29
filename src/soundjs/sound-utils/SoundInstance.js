// TODO remove SoundInstance from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundInstance = (function () {

    var SoundChannel = createjs.soundUtils.SoundChannel;

    var _soundPlugin = null,
        _soundParser = null,
        _soundRegister = null;

    var _instances = [],
        _lastID = 0;
    
    var SoundInstance = function (soundPlugin, soundParser, soundRegister) {
        _soundPlugin = soundPlugin;
        _soundParser = soundParser;
        _soundRegister = soundRegister;
        this.defaultInterruptBehavior = InterruptMode.INTERRUPT_NONE;
    };

    var prototype = SoundInstance.prototype;
    prototype.constructor = SoundInstance;

    prototype.playInstance = _playInstance;
    prototype.beginPlaying = _beginPlaying;
    prototype.playFinished = _playFinished;
    prototype.createInstance = createInstance;
    prototype.play = play;
    prototype.stop = stop;
    prototype.setDefaultPlayProps = setDefaultPlayProps;
    prototype.getDefaultPlayProps = getDefaultPlayProps;

    return SoundInstance;

    function _playInstance(instance, playProps) {
        var defaultPlayProps = _soundRegister.defaultPlayPropsHash[instance.src] || {};
        if (playProps.interrupt == null) {playProps.interrupt = defaultPlayProps.interrupt || this.defaultInterruptBehavior};
        if (playProps.delay == null) {playProps.delay = defaultPlayProps.delay || 0;}
        if (playProps.offset == null) {playProps.offset = instance.position;}
        if (playProps.loop == null) {playProps.loop = instance.loop;}
        if (playProps.volume == null) {playProps.volume = instance.volume;}
        if (playProps.pan == null) {playProps.pan = instance.pan;}

        if (playProps.delay == 0) {
            var ok = _beginPlaying(instance, playProps);
            if (!ok) {return false;}
        } else {
            //Note that we can't pass arguments to proxy OR setTimeout (IE only), so just wrap the function call.
            // OJR WebAudio may want to handle this differently, so it might make sense to move this functionality into the plugins in the future
            var delayTimeoutId = setTimeout(function () {
                _beginPlaying(instance, playProps);
            }, playProps.delay);
            instance.delayTimeoutId = delayTimeoutId;
        }

        _instances.push(instance);

        return true;
    }

    function _beginPlaying(instance, playProps) {
        if (!SoundChannel.add(instance, playProps.interrupt)) {
            return false;
        }
        var result = instance._beginPlaying(playProps);
        if (!result) {
            var index = createjs.indexOf(_instances, instance);
            if (index > -1) { _instances.splice(index, 1); }
            return false;
        }
        return true;
    }

    function _playFinished(instance) {
        SoundChannel.remove(instance);
        var index = createjs.indexOf(_instances, instance);
        if (index > -1) { _instances.splice(index, 1); }	// OJR this will always be > -1, there is no way for an instance to exist without being added to this._instances
    }

	function createInstance(src, startTime, duration) {
		if (!_soundPlugin.initializeDefaultPlugins()) {
			return new createjs.DefaultSoundInstance(src, startTime, duration);
		}

		var defaultPlayProps = _soundRegister.defaultPlayPropsHash[src];	// for audio sprites, which create and store defaults by id
		src = _soundParser.getSrcById(src);

		var details = _soundParser.parsePath(src.src);

		var instance = null;
		if (details != null && details.src != null) {
			SoundChannel.create(details.src);
			if (startTime == null) { startTime = src.startTime; }
			instance = _soundPlugin.activePlugin.create(details.src, startTime, duration || src.duration);

			defaultPlayProps = defaultPlayProps || _soundRegister.defaultPlayPropsHash[details.src];
			if (defaultPlayProps) {
				instance.applyPlayProps(defaultPlayProps);
			}
		} else {
			instance = new createjs.DefaultSoundInstance(src, startTime, duration);
		}

		instance.uniqueId = _lastID++;

		return instance;
	}

	function play(src, props) {
		var playProps = createjs.PlayPropsConfig.create(props);
		var instance = createInstance(src, playProps.startTime, playProps.duration);
		var ok = _playInstance(instance, playProps);
		if (!ok) { instance._playFailed(); }
		return instance;
    }
    
    function stop () {
		for (var i = _instances.length; i--; ) {
			_instances[i].stop();  // NOTE stop removes instance from this._instances
		}
    }
})();