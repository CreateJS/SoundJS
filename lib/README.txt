# lib directory
This directory contains a compressed version of the SoundJS library, including the most recent tagged release and the
in-progress NEXT release.

Both combined and minified versions of the library are included. The former being useful for debugging, and the latter
for deployment.

You can also link to the libraries on the [CreateJS CDN](http://code.createjs.com/), to benefit from faster load times
and shared caching across sites.

# libraries
**soundjs-VERSION.min.js** contains minified versions of all of the SoundJS classes (comments and white space stripped)
except for the Flash and Cordova audio plugins.
**flashaudioplugin-VERSION.min.js** contains minified versions of the Flash audio plugin.
**cordovaaudioplugin-VERSION.min.js** contains minified versions of the Cordova audio plugin.
**soundjs-VERSION.combined.js** contains all the SoundJS classes (except Flash and Cordova plugin classes) including
whitespace and comments.
**flashaudioplugin-VERSION.combined.js** contains all the Flash audio plugin classes.
**cordovaaudioplugin-VERSION.combined.js** contains all the Cordova audio plugin classes.


# license
The libraries are ©2010 gskinner.com, inc., and made available under the highly permissive MIT open source software
license. See the source file header for the full license text.
