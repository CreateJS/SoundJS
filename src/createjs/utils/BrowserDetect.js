/*
* BrowserDetect
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @module CreateJS
 */

// namespace:
this.createjs = this.createjs||{};

(function() {
	"use strict";

	/**
	 * An additional module to determine the current browser, version, operating system, and other environment
	 * variables. It is not publically documented.
	 * Used for audio because feature detection is unable to detect the many limitations of mobile devices.
	 * #class BrowserDetect
	 * @param {Boolean} isFirefox True if our browser is Firefox.
	 * @param {Boolean} isOpera True if our browser is opera.
	 * @param {Boolean} isChrome True if our browser is Chrome.  Note that Chrome for Android returns true, but is a
	 * completely different browser with different abilities.
	 * @param {Boolean} isIOS True if our browser is safari for iOS devices (iPad, iPhone, and iPad).
	 * @param {Boolean} isAndroid True if our browser is Android.
	 * @param {Boolean} isBlackberry True if our browser is Blackberry.
	 * @constructor
	 * @static
	 */
	function BrowserDetect() {
		throw "BrowserDetect cannot be instantiated";
	};


	var agent = BrowserDetect.agent = window.navigator.userAgent;
	BrowserDetect.isWindowPhone =  (agent.indexOf("IEMobile") > -1) || (agent.indexOf("Windows Phone") > -1);
	BrowserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
	BrowserDetect.isOpera = (window.opera != null);
	BrowserDetect.isChrome = (agent.indexOf("Chrome") > -1);  // NOTE that Chrome on Android returns true but is a completely different browser with different abilities
	BrowserDetect.isIOS = (agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1) && !BrowserDetect.isWindowPhone;
	BrowserDetect.isAndroid = (agent.indexOf("Android") > -1);
	BrowserDetect.isBlackberry = (agent.indexOf("Blackberry") > -1);

	createjs.BrowserDetect = BrowserDetect;

}());
