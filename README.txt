SOUNDJS LIBRARY:

SoundJS is a library to make working with the audio on the web easier. It provides a consistent API for playing audio in different browsers, including using a target plugin model to provide an easy way to provide additional audio plugins like Web Audio, and a Flash fallback. A mechanism has been provided for easily tying in audio preloading to PreloadJS (http://preloadjs.com)

The home page for SoundJS can be found at http://soundjs.com/

There is a GitHub repository, which includes downloads, issue tracking, & a wiki at https://github.com/CreateJS/SoundjS/

It was built by gskinner.com, and is released for free under the MIT license, which means you can use it for almost any purpose (including commercial projects). We appreciate credit where possible, but it is not a requirement.

SoundJS is currently in alpha. We will be making significant improvements to the library, samples, and documentation over the coming weeks. Please be aware that this may necessitate changes to the existing API.


The key classes are:

SoundJS
The core API for playing sounds. Simply call SoundJS.play(sound, options), and a sound instance is created that can be used to control the audio, and receive events when it is complete, loops, or is interrupted.

SoundInstance
A controllable sound object that wraps the actual plugin implementation, providing a consistent API for audio playback, no matter what happens in the background. Sound instances can be paused, muted, and stopped, and the volume, pan (where available), and position using the simple API.

HTMLAudioPlugin
The default, built-in plugin, which manages audio playback via the HTML5 <audio> tag.

FlashPlugin
An additional plugin which uses a flash shim (and SWFObject) to playback audio using Flash.

Have a look at the included examples and API documentation for more in-depth information.