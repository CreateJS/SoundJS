# SoundJS

SoundJS is a library to make working with audio on the web easier. It provides a consistent API for playing audio in
different browsers, including using a target plugin model to provide an easy way to provide additional audio plugins
like a Flash fallback (included, but must be used separately from the combined/minified version).

A mechanism has been provided for easily tying in audio preloading to [PreloadJS](http://createjs.com/preloadjs/).


## Example

```javascript
createjs.Sound.on("fileload", handleLoadComplete);
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound({src:"path/to/sound.ogg", id:"sound"});
function handleLoadComplete(event) {
	createjs.Sound.play("sound");
}
```

## License
Built by gskinner.com, and released for free under the MIT license, which means you can use it for almost any purpose
(including commercial projects). We appreciate credit where possible, but it is not a requirement.


## Support and Resources
* Find examples and more information at the [SoundJS web site](http://soundjs.com/)
* Read the [documentation](http://createjs.com/docs/soundjs/)
* Discuss, share projects, and interact with other users on [reddit](http://www.reddit.com/r/createjs/).
* Ask technical questions on [Stack Overflow](http://stackoverflow.com/questions/tagged/soundjs).
* File verified bugs or formal feature requests using Issues on [GitHub](https://github.com/CreateJS/SoundJS/issues).
* Have a look at the included [examples](https://github.com/CreateJS/SoundJS/tree/master/examples) and
[API documentation](http://createjs.com/docs/soundjs/) for more in-depth information.


## Classes

### [Sound](http://createjs.com/Docs/SoundJS/classes/Sound.html)
The core API for playing sounds. Call createjs.Sound.play(sound, ...options), and a sound instance is created that can be
used to control the audio, and dispatches events when it is complete, loops, or is interrupted.

### [SoundInstance](http://createjs.com/Docs/SoundJS/classes/AbstractSoundInstance.html)
A controllable sound object that wraps the actual plugin implementation, providing a consistent API for audio playback,
no matter what happens in the background. Sound instances can be paused, muted, and stopped; and the volume, pan (where
available), and position changed using the simple API.

### [WebAudioPlugin](http://createjs.com/Docs/SoundJS/classes/WebAudioPlugin.html)
The default, built-in plugin, which uses Web Audio APIs to playback sounds. Note that WebAudio will fail to load when
run locally, and the HTML audio plugin will be used instead.

### [HTMLAudioPlugin](http://createjs.com/Docs/SoundJS/classes/HTMLAudioPlugin.html)
The fallback built-in plugin, which manages audio playback via the HTML5 <audio> tag. This will be used in instances
where the WebAudio plugin is not available.

### [CordovaAudioPlugin](http://createjs.com/docs/soundjs/classes/CordovaAudioPlugin.html)
An additional plugin which will playback audio in a Cordova app and tools that utilize Cordova such as PhoneGap or Ionic.
You must manually register this plugin. Currently available on github since SoundJS-0.6.1.

### [FlashAudioPlugin](http://createjs.com/Docs/SoundJS/classes/FlashAudioPlugin.html)
An additional plugin which uses a flash shim (and SWFObject) to playback audio using Flash. You must manually set up and
register this plugin.

## [Documentation and examples](http://createjs.com/docs/soundjs/)
Have a look at the included examples and API documentation for more in-depth information.
