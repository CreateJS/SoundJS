/**
 * The Sound JavaScript library manages the playback of audio on the web. It works via plugins which abstract the actual audio
 * implementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary
 * to play sounds.
 *
 * To use SoundJS, use the public API on the {{#crossLink "Sound"}}{{/crossLink}} class. This API is for:
 * <ul>
 *      <li>Installing audio playback Plugins</li>
 *      <li>Registering (and preloading) sounds</li>
 *      <li>Creating and playing sounds</li>
 *      <li>Master volume, mute, and stop controls for all sounds at once</li>
 * </ul>
 *
 * <b>Controlling Sounds</b><br />
 * Playing sounds creates {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} instances, which can be controlled
 * individually.
 * <ul>
 *      <li>Pause, resume, seek, and stop sounds</li>
 *      <li>Control a sound's volume, mute, and pan</li>
 *      <li>Listen for events on sound instances to get notified when they finish, loop, or fail</li>
 * </ul>
 *
 * <h4>Example</h4>
 *
 *      createjs.Sound.alternateExtensions = ["mp3"];
 *      createjs.Sound.on("fileload", this.loadHandler, this);
 *      createjs.Sound.registerSound("path/to/mySound.ogg", "sound");
 *      function loadHandler(event) {
 *          // This is fired for each sound that is registered.
 *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use full sourcepath or event.src.
 *          instance.on("complete", this.handleComplete, this);
 *          instance.volume = 0.5;
 *      }
 *
 * <h4>Browser Support</h4>
 * Audio will work in browsers which support Web Audio (<a href="http://caniuse.com/audio-api" target="_blank">http://caniuse.com/audio-api</a>)
 * or HTMLAudioElement (<a href="http://caniuse.com/audio" target="_blank">http://caniuse.com/audio</a>).
 * A Flash fallback can be used for any browser that supports the Flash player, and the Cordova plugin can be used in
 * any webview that supports <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Cordova.Media</a>.
 * IE8 and earlier are not supported, even with the Flash fallback. To support earlier browsers, you can use an older
 * version of SoundJS (version 0.5.2 and earlier).
 *
 * @main SoundJS
 */

// re-export shared classes
export { default as EventDispatcher } from "createjs/src/events/EventDispatcher";
export { default as Event } from "createjs/src/events/Event";
export { default as Ticker } from "createjs/src/utils/Ticker";

// TODO: Review this version export.
// version (templated in gulpfile, pulled from package).
// export const version = "<%= version %>";
