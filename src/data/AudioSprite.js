//  NOTE this is "Class" is purely to document audioSprite Setup and usage.
/**
 * @module SoundJS
 */

/**
 * <strong>Note: AudioSprite is not a class, but its usage is easily lost in the documentation, so it has been called
 * out here for quick reference.</strong>
 *
 * Audio sprites are much like CSS sprites or image sprite sheets: multiple audio assets grouped into a single file.
 * Audio sprites work around limitations in certain browsers, where only a single sound can be loaded and played at a
 * time. We recommend at least 300ms of silence between audio clips to deal with HTML audio tag inaccuracy, and to prevent
 * accidentally playing bits of the neighbouring clips.
 *
 * <strong>Benefits of Audio Sprites:</strong>
 * <ul>
 *     <li>More robust support for older browsers and devices that only allow a single audio instance, such as iOS 5.</li>
 *     <li>They provide a work around for the Internet Explorer 9 audio tag limit, which restricts how many different
 *     sounds that could be loaded at once.</li>
 *     <li>Faster loading by only requiring a single network request for several sounds, especially on mobile devices
 * where the network round trip for each file can add significant latency.</li>
 * </ul>
 *
 * <strong>Drawbacks of Audio Sprites</strong>
 * <ul>
 *     <li>No guarantee of smooth looping when using HTML or Flash audio. If you have a track that needs to loop
 * 		smoothly and you are supporting non-web audio browsers, do not use audio sprites for that sound if you can avoid
 * 		it.</li>
 *     <li>No guarantee that HTML audio will play back immediately, especially the first time. In some browsers
 *     (Chrome!), HTML audio will only load enough to play through at the current download speed – so we rely on the
 *     `canplaythrough` event to determine if the audio is loaded. Since audio sprites must jump ahead to play specific
 *     sounds, the audio may not yet have downloaded fully.</li>
 *     <li>Audio sprites share the same core source, so if you have a sprite with 5 sounds and are limited to 2
 * 		concurrently playing instances, you can only play 2 of the sounds at the same time.</li>
 * </ul>
 *
 * <h4>Example</h4>
 *
 *		createjs.Sound.initializeDefaultPlugins();
 *		var assetsPath = "./assets/";
 *		var sounds = [{
 *			src:"MyAudioSprite.ogg", data: {
 *				audioSprite: [
 *					{id:"sound1", startTime:0, duration:500},
 *					{id:"sound2", startTime:1000, duration:400},
 *					{id:"sound3", startTime:1700, duration: 1000}
 *				]}
 *			}
 *		];
 *		createjs.Sound.alternateExtensions = ["mp3"];
 *		createjs.Sound.on("fileload", loadSound);
 *		createjs.Sound.registerSounds(sounds, assetsPath);
 *		// after load is complete
 *		createjs.Sound.play("sound2");
 *
 * You can also create audio sprites on the fly by setting the startTime and duration when creating an new AbstractSoundInstance.
 *
 * 		createjs.Sound.play("MyAudioSprite", {startTime: 1000, duration: 400});
 *
 * The excellent CreateJS community has created a tool to create audio sprites, available at
 * <a href="https://github.com/tonistiigi/audiosprite" target="_blank">https://github.com/tonistiigi/audiosprite</a>,
 * as well as a <a href="http://jsfiddle.net/bharat_battu/g8fFP/12/" target="_blank">jsfiddle</a> to convert the output
 * to SoundJS format.
 *
 * @class AudioSprite
 * @since 0.6.0
 */
