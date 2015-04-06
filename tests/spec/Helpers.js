beforeEach(function () {
	this.baseAssetsPath = "../_assets/";

	this.getFilePath = function (fileObj) {
		if (typeof fileObj == "string") {
			return this.baseAssetsPath + fileObj;
		} else {
			return this.baseAssetsPath + fileObj.src;
		}
	}

	this.findClass = function (selector) {
		// search backwards because the last match is more likely the right one
		for (var i = document.styleSheets.length - 1; i >= 0; i--) {
			var cssRules = document.styleSheets[i].cssRules ||
					document.styleSheets[i].rules || []; // IE support
			for (var c = 0; c < cssRules.length; c++) {
				if (cssRules[c].selectorText === selector) {
					return true;
				}
			}
		}
		return false;
	}

	var customMatchers = {
		toBeInRange: function (util, customEqualityTesters) {
			return {
				compare: function (actual, excpected, range) {
					var result = {};
					range = range || 0;

					if (actual <= (excpected + range) && actual >= (excpected - range)) {
						result.pass = true;
					} else {
						result.pass = false;
					}
					return result;
				}
			};
		}
	};

	jasmine.addMatchers(customMatchers);
});
