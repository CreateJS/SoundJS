module.exports = function (config) {
  // browsers and reporters set in gulpfile
  config.set({
    frameworks: [ "jasmine" ],
    basePath: "../",
    files: [
      // assets
      { pattern: "assets/audio/**/*", included: false },
      // deps
      // "assets/libs/preloadjs-NEXT.min.js",
      // lib and sourcemap
      "dist/soundjs-NEXT.min.js",
      { pattern: "src/**/*.js", included: false },
      { pattern: "dist/sound-NEXT.js.map", included: false },
      // helpers
      "tests/helpers/helpers.js",
      // specs
      "tests/spec/*.js"
    ],
    preprocessors: {
      "**/*.js": [ "sourcemap" ]
    },
    proxies: {
      '/assets/': '/base/assets/'
    }
  });
};
