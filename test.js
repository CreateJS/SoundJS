// Some method and attribute names have changed during API review. It is recommended that an implementation support both names:

AudioBufferSourceNode.noteOn() has been changed to start()
AudioBufferSourceNode.noteGrainOn() has been changed to start()
AudioBufferSourceNode.noteOff() has been changed to stop()

AudioContext.createGainNode() has been changed to createGain()
AudioContext.createDelayNode() has been changed to createDelay()
AudioContext.createJavaScriptNode() has been changed to createScriptProcessor()

OscillatorNode.noteOn() has been changed to start()
OscillatorNode.noteOff() has been changed to stop()

AudioParam.setTargetValueAtTime() has been changed to setTargetAtTime()
