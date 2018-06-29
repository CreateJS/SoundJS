// TODO remove SoundFactory from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundFactory = (function () {
    var SoundEventHandler = createjs.soundUtils.SoundEventHandler,
        SoundInstance = createjs.soundUtils.SoundInstance,
        SoundParser = createjs.soundUtils.SoundParser,
        SoundPlugin = createjs.soundUtils.SoundPlugin,
        SoundRegister = createjs.soundUtils.SoundRegister,
        SoundVolume = createjs.soundUtils.SoundVolume;

    var _soundEventHandler = null,
        _soundInstance = null,
        _soundParser = null,
        _soundPlugin = null,
        _soundRegister = null,
        _soundVolume = null;

    return {
        getSoundEventHandler: getSoundEventHandler,
        getSoundInstance: getSoundInstance,
        getSoundParser: getSoundParser,
        getSoundPlugin: getSoundPlugin,
        getSoundRegister: getSoundRegister,
        getSoundVolume: getSoundVolume
    }

    function getSoundEventHandler() {
        if (!_soundEventHandler)
            _soundEventHandler = new SoundEventHandler();

        return _soundEventHandler;
    }
    function getSoundInstance() {
        if (!_soundInstance) {
            var soundPlugin = getSoundPlugin(),
                soundParser = getSoundParser(),
                soundRegister = getSoundRegister();

            _soundInstance = new SoundInstance(soundPlugin, soundParser, soundRegister);
        }

        return _soundInstance;
    }
    function getSoundParser() {
        if (!_soundParser) {
            var soundVolume = getSoundVolume();
            _soundParser = new SoundParser(soundVolume);
        }

        return _soundParser;
    }
    function getSoundPlugin() {
        if (!_soundPlugin)
            _soundPlugin = new SoundPlugin();

        return _soundPlugin;
    }
    function getSoundRegister() {
        if (!_soundRegister) {
            var soundEventHandler = getSoundEventHandler(),
                soundPlugin = getSoundPlugin(),
                soundParser = getSoundParser();

            _soundRegister = new SoundRegister(soundEventHandler, soundPlugin, soundParser);
        }

        return _soundRegister;
    }
    function getSoundVolume() {
        if (!_soundVolume) {
            var soundPlugin = getSoundPlugin(),
                soundInstance = getSoundInstance();

            _soundVolume = new SoundVolume(soundPlugin, soundInstance);
        }

        return _soundVolume;
    }
})();