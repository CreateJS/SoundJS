#!/usr/bin/env node

var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    optimist = require('optimist'),
    _ = require('underscore');

/**  

20. Deprecation Notes

Some method and attribute names have changed during API review. It is recommended that an implementation support both names:

    AudioBufferSourceNode.noteOn() has been changed to start()
    AudioBufferSourceNode.noteGrainOn() has been changed to start()
    AudioBufferSourceNode.noteOff() has been changed to stop()

    AudioContext.createGainNode() has been changed to createGain()
    AudioContext.createDelayNode() has been changed to createDelay()
    AudioContext.createJavaScriptNode() has been changed to createScriptProcessor()

    OscillatorNode.noteOn() has been changed to start()
    OscillatorNode.noteOff() has been changed to stop()

    AudioParam.setTargetValueAtTime() has been changed to setTargetAtTime()
 */

var L = console.log,
    D = function(o) { L(util.inspect(o)); },
    F = function(s) { return util.format.apply(null, arguments); };


function main(options, callback) {
    fs.readFile(options.file, 'utf8', function(err, raw) {
        if (err) throw err;
        var lines = raw.split("\n"), results = [];

        L(F("Got %d lines to scan, scanning...", lines.length));

        var needles = [
            'noteOn',
            'noteGrainOn',
            'noteOff',
            'createGainNode',
            'createDelayNode',
            'createJavaScriptNode',
            'setTargetValueAtTime'
        ];

        _.each(lines, function(line, line_nbr) {
            // L(line);
            var _line_results = {matched: [], line_nbr: (line_nbr+1)};
            _.each(needles, function(item) {
                if (line.indexOf(item) !== -1) {
                    _line_results.matched.push(item)
                }
            });

            if (_line_results.matched.length > 0) {
                results.push(_line_results);
            }

        });
        D(results);
    });

}

if (!module.parent) {
    // this is the main module

    var argv = optimist
        .usage('Usage: $0 -f $file | Usage: $0 --file $file')
        .demand(['f'])
        .alias('f', 'file')
        .argv;

    main(argv);
};