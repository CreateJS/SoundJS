// namespace:
this.createjs = this.createjs || {};

(function() {
	var s = {};

	/**
	 * The preload type for generic binary types. Note that images are loaded as binary files when using XHR.
	 * @property BINARY
	 * @type {String}
	 * @default binary
	 * @static
	 * @since 0.6.0
	 */
	s.BINARY = "binary";

	/**
	 * The preload type for css files. CSS files are loaded using a &lt;link&gt; when loaded with XHR, or a
	 * &lt;style&gt; tag when loaded with tags.
	 * @property CSS
	 * @type {String}
	 * @default css
	 * @static
	 * @since 0.6.0
	 */
	s.CSS = "css";

	/**
	 * The preload type for font files.
	 * @property FONT
	 * @type {String}
	 * @default font
	 * @static
	 * @since 0.9.0
	 */
	s.FONT = "font";

	/**
	 * The preload type for fonts specified with CSS (such as Google fonts)
	 * @property FONTCSS
	 * @type {String}
	 * @default fontcss
	 * @static
	 * @since 0.9.0
	 */
	s.FONTCSS = "fontcss";

	/**
	 * The preload type for image files, usually png, gif, or jpg/jpeg. Images are loaded into an &lt;image&gt; tag.
	 * @property IMAGE
	 * @type {String}
	 * @default image
	 * @static
	 * @since 0.6.0
	 */
	s.IMAGE = "image";

	/**
	 * The preload type for javascript files, usually with the "js" file extension. JavaScript files are loaded into a
	 * &lt;script&gt; tag.
	 *
	 * Since version 0.4.1+, due to how tag-loaded scripts work, all JavaScript files are automatically injected into
	 * the body of the document to maintain parity between XHR and tag-loaded scripts. In version 0.4.0 and earlier,
	 * only tag-loaded scripts are injected.
	 * @property JAVASCRIPT
	 * @type {String}
	 * @default javascript
	 * @static
	 * @since 0.6.0
	 */
	s.JAVASCRIPT = "javascript";

	/**
	 * The preload type for json files, usually with the "json" file extension. JSON data is loaded and parsed into a
	 * JavaScript object. Note that if a `callback` is present on the load item, the file will be loaded with JSONP,
	 * no matter what the {{#crossLink "LoadQueue/preferXHR:property"}}{{/crossLink}} property is set to, and the JSON
	 * must contain a matching wrapper function.
	 * @property JSON
	 * @type {String}
	 * @default json
	 * @static
	 * @since 0.6.0
	 */
	s.JSON = "json";

	/**
	 * The preload type for jsonp files, usually with the "json" file extension. JSON data is loaded and parsed into a
	 * JavaScript object. You are required to pass a callback parameter that matches the function wrapper in the JSON.
	 * Note that JSONP will always be used if there is a callback present, no matter what the {{#crossLink "LoadQueue/preferXHR:property"}}{{/crossLink}}
	 * property is set to.
	 * @property JSONP
	 * @type {String}
	 * @default jsonp
	 * @static
	 * @since 0.6.0
	 */
	s.JSONP = "jsonp";

	/**
	 * The preload type for json-based manifest files, usually with the "json" file extension. The JSON data is loaded
	 * and parsed into a JavaScript object. PreloadJS will then look for a "manifest" property in the JSON, which is an
	 * Array of files to load, following the same format as the {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}
	 * method. If a "callback" is specified on the manifest object, then it will be loaded using JSONP instead,
	 * regardless of what the {{#crossLink "LoadQueue/preferXHR:property"}}{{/crossLink}} property is set to.
	 * @property MANIFEST
	 * @type {String}
	 * @default manifest
	 * @static
	 * @since 0.6.0
	 */
	s.MANIFEST = "manifest";

	/**
	 * The preload type for sound files, usually mp3, ogg, or wav. When loading via tags, audio is loaded into an
	 * &lt;audio&gt; tag.
	 * @property SOUND
	 * @type {String}
	 * @default sound
	 * @static
	 * @since 0.6.0
	 */
	s.SOUND = "sound";

	/**
	 * The preload type for video files, usually mp4, ts, or ogg. When loading via tags, video is loaded into an
	 * &lt;video&gt; tag.
	 * @property VIDEO
	 * @type {String}
	 * @default video
	 * @static
	 * @since 0.6.0
	 */
	s.VIDEO = "video";

	/**
	 * The preload type for SpriteSheet files. SpriteSheet files are JSON files that contain string image paths.
	 * @property SPRITESHEET
	 * @type {String}
	 * @default spritesheet
	 * @static
	 * @since 0.6.0
	 */
	s.SPRITESHEET = "spritesheet";

	/**
	 * The preload type for SVG files.
	 * @property SVG
	 * @type {String}
	 * @default svg
	 * @static
	 * @since 0.6.0
	 */
	s.SVG = "svg";

	/**
	 * The preload type for text files, which is also the default file type if the type can not be determined. Text is
	 * loaded as raw text.
	 * @property TEXT
	 * @type {String}
	 * @default text
	 * @static
	 * @since 0.6.0
	 */
	s.TEXT = "text";

	/**
	 * The preload type for xml files. XML is loaded into an XML document.
	 * @property XML
	 * @type {String}
	 * @default xml
	 * @static
	 * @since 0.6.0
	 */
	s.XML = "xml";

	createjs.Types = s;
}());
