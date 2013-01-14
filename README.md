# SoundJS

SoundJS is a library to make working with audio on the web easier. It provides a consistent API for playing audio in different browsers, including using a target plugin model to provide an easy way to provide additional audio plugins like Web Audio, and a Flash fallback. A mechanism has been provided for easily tying in audio preloading to PreloadJS (http://preloadjs.com)


## License
Built by gskinner.com, and released for free under the MIT license, which means you can use it for almost any purpose (including commercial projects). We appreciate credit where possible, but it is not a requirement.


## Support and Resources
* Find examples and more information at the [SoundJS web site](http://soundjs.com/)
* You can also ask questions and interact with other users at our [Community](http://community.createjs.com) site.
* Have a look at the included [examples](https://github.com/CreateJS/SoundJS/tree/master/examples) and [API documentation](http://createjs.com/Docs/SoundJS/) for more in-depth information.


## Classes

### [Sound](http://createjs.com/Docs/SoundJS/Sound.html)
The core API for playing sounds. Simply call Sound.play(sound, options), and a sound instance is created that can be used to control the audio, and receive events when it is complete, loops, or is interrupted.

### [SoundInstance](http://createjs.com/Docs/SoundJS/SoundInstance.html)
A controllable sound object that wraps the actual plugin implementation, providing a consistent API for audio playback, no matter what happens in the background. Sound instances can be paused, muted, and stopped, and the volume, pan (where available), and position using the simple API.

### [HTMLAudioPlugin](http://createjs.com/Docs/SoundJS/HTMLAudioPlugin.html)
The default, built-in plugin, which manages audio playback via the HTML5 <audio> tag.

### [FlashPlugin](http://createjs.com/Docs/SoundJS/FlashPlugin.html)
An additional plugin which uses a flash shim (and SWFObject) to playback audio using Flash.

## [Documentation and examples](http://createjs.com/Docs/SoundJS/)
Have a look at the included examples and API documentation for more in-depth information.
