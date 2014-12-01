(function () {

	var s = {};

	/**
	 * The Regular Expression used to test file URLS for an absolute path.
	 * @property ABSOLUTE_PATH
	 * @static
	 * @type {RegExp}
	 * @since 0.4.2
	 */
	s.ABSOLUTE_PATT = /^(?:\w+:)?\/{2}/i;

	/**
	 * The Regular Expression used to test file URLS for an absolute path.
	 * @property RELATIVE_PATH
	 * @static
	 * @type {RegExp}
	 * @since 0.4.2
	 */
	s.RELATIVE_PATT = (/^[./]*?\//i);

	/**
	 * The Regular Expression used to test file URLS for an extension. Note that URIs must already have the query string
	 * removed.
	 * @property EXTENSION_PATT
	 * @static
	 * @type {RegExp}
	 * @since 0.4.2
	 */
	s.EXTENSION_PATT = /\/?[^/]+\.(\w{1,5})$/i;

	/**
	 * @method _parseURI
	 * Parse a file path to determine the information we need to work with it. Currently, PreloadJS needs to know:
	 * <ul>
	 *     <li>If the path is absolute. Absolute paths start with a protocol (such as `http://`, `file://`, or
	 *     `//networkPath`)</li>
	 *     <li>If the path is relative. Relative paths start with `../` or `/path` (or similar)</li>
	 *     <li>The file extension. This is determined by the filename with an extension. Query strings are dropped, and
	 *     the file path is expected to follow the format `name.ext`.</li>
	 * </ul>
	 *
	 * <strong>Note:</strong> This has changed from earlier versions, which used a single, complicated Regular Expression, which
	 * was difficult to maintain, and over-aggressive in determining all file properties. It has been simplified to
	 * only pull out what it needs.
	 * @param path
	 * @returns {Object} An Object with an `absolute` and `relative` Boolean, as well as an optional 'extension` String
	 * property, which is the lowercase extension.
	 * @private
	 */
	s.parseURI = function (path) {
		var info = {absolute: false, relative: false};
		if (path == null) { return info; }

		// Drop the query string
		var queryIndex = path.indexOf("?");
		if (queryIndex > -1) {
			path = path.substr(0, queryIndex);
		}

		// Absolute
		var match;
		if (s.ABSOLUTE_PATT.test(path)) {
			info.absolute = true;

			// Relative
		} else if (s.RELATIVE_PATT.test(path)) {
			info.relative = true;
		}

		// Extension
		if (match = path.match(s.EXTENSION_PATT)) {
			info.extension = match[1].toLowerCase();
		}
		return info;
	};

	/**
	 * Formats an object into a query string for either a POST or GET request.
	 * @method _formatQueryString
	 * @param {Object} data The data to convert to a query string.
	 * @param {Array} [query] Existing name/value pairs to append on to this query.
	 * @private
	 */
	s.formatQueryString = function (data, query) {
		if (data == null) {
			throw new Error('You must specify data.');
		}
		var params = [];
		for (var n in data) {
			params.push(n + '=' + escape(data[n]));
		}
		if (query) {
			params = params.concat(query);
		}
		return params.join('&');
	};

	/**
	 * A utility method that builds a file path using a source and a data object, and formats it into a new path. All
	 * of the loaders in PreloadJS use this method to compile paths when loading.
	 * @method buildPath
	 * @param {String} src The source path to add values to.
	 * @param {Object} [data] Object used to append values to this request as a query string. Existing parameters on the
	 * path will be preserved.
	 * @returns {string} A formatted string that contains the path and the supplied parameters.
	 * @since 0.3.1
	 */
	s.buildPath = function (src, data) {
		if (data == null) {
			return src;
		}

		var query = [];
		var idx = src.indexOf('?');

		if (idx != -1) {
			var q = src.slice(idx + 1);
			query = query.concat(q.split('&'));
		}

		if (idx != -1) {
			return src.slice(0, idx) + '?' + this._formatQueryString(data, query);
		} else {
			return src + '?' + this._formatQueryString(data, query);
		}
	};

	/**
	 * @method _isCrossDomain
	 * @param {Object} item A load item with a `src` property
	 * @return {Boolean} If the load item is loading from a different domain than the current location.
	 * @private
	 */
	s.isCrossDomain = function (item) {
		var target = document.createElement("a");
		target.href = item.src;

		var host = document.createElement("a");
		host.href = location.href;

		var crossdomain = (target.hostname != "") &&
						  (target.port != host.port ||
						   target.protocol != host.protocol ||
						   target.hostname != host.hostname);
		return crossdomain;
	};

	/**
	 * @method _isLocal
	 * @param {Object} item A load item with a `src` property
	 * @return {Boolean} If the load item is loading from the "file:" protocol. Assume that the host must be local as
	 * well.
	 * @private
	 */
	s.isLocal = function (item) {
		var target = document.createElement("a");
		target.href = item.src;
		return target.hostname == "" && target.protocol == "file:";
	};

	/**
	 * Determine if a specific type should be loaded as a binary file. Currently, only images and items marked
	 * specifically as "binary" are loaded as binary. Note that audio is <b>not</b> a binary type, as we can not play
	 * back using an audio tag if it is loaded as binary. Plugins can change the item type to binary to ensure they get
	 * a binary result to work with. Binary files are loaded using XHR2.
	 * @method isBinary
	 * @param {String} type The item type.
	 * @return {Boolean} If the specified type is binary.
	 * @private
	 */
	s.isBinary = function (type) {
		switch (type) {
			case createjs.AbstractLoader.IMAGE:
			case createjs.AbstractLoader.BINARY:
				return true;
			default:
				return false;
		}
	};

	/**
	 * Determine if a specific type is a text based asset, and should be loaded as UTF-8.
	 * @method isText
	 * @param {String} type The item type.
	 * @return {Boolean} If the specified type is text.
	 * @private
	 */
	s.isText = function (type) {
		switch (type) {
			case createjs.AbstractLoader.TEXT:
			case createjs.AbstractLoader.JSON:
			case createjs.AbstractLoader.MANIFEST:
			case createjs.AbstractLoader.XML:
			case createjs.AbstractLoader.HTML:
			case createjs.AbstractLoader.CSS:
			case createjs.AbstractLoader.SVG:
			case createjs.AbstractLoader.JAVASCRIPT:
				return true;
			default:
				return false;
		}
	};

	/**
	 * Determine the type of the object using common extensions. Note that the type can be passed in with the load item
	 * if it is an unusual extension.
	 * @param {String} extension The file extension to use to determine the load type.
	 * @return {String} The determined load type (for example, <code>AbstractLoader.IMAGE</code> or null if it can not be
	 * determined by the extension.
	 * @private
	 */
	s.getTypeByExtension = function (extension) {
		if (extension == null) {
			return createjs.AbstractLoader.TEXT;
		}
		switch (extension.toLowerCase()) {
			case "jpeg":
			case "jpg":
			case "gif":
			case "png":
			case "webp":
			case "bmp":
				return createjs.AbstractLoader.IMAGE;
			case "ogg":
			case "mp3":
			case "webm":
				return createjs.AbstractLoader.SOUND;
			case "mp4":
			case "webm":
			case "ts":
				return createjs.AbstractLoader.VIDEO;
			case "json":
				return createjs.AbstractLoader.JSON;
			case "xml":
				return createjs.AbstractLoader.XML;
			case "css":
				return createjs.AbstractLoader.CSS;
			case "js":
				return createjs.AbstractLoader.JAVASCRIPT;
			case 'svg':
				return createjs.AbstractLoader.SVG;
			default:
				return createjs.AbstractLoader.TEXT;
		}
	};

	createjs.RequestUtils = s;

}());
