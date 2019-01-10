const POTENTIOMETER_MODE = {
  POLAR: "PMODE_POLAR",
  LINEAR: "PMODE_LINEAR"
}

class Utils {
  static lerp(a, b, n) {
    return (1 - n) * a + n * b;
  }
}

/*



*/

class MixerSwitch {
  constructor ({
    value = false,
    dimensions = {width:30, height: 20},
    position = {x: 0, y:0},
    callback = ()=>{},
    graphic = new createjs.Shape()
  }) {
    this.value = false;
    this.dimensions = dimensions;
    this.position = position;
    this.g = graphic
    this.draw();
    this.g.x = this.position.x;
    this.g.y = this.position.y;
    this.callback = callback;
    this.g.on("click", (evt)=>this.setValue());
  }
  setValue() {
        this.value=!this.value; 
        this.draw();
        this.callback(this.value);
  }
  draw() {
    let opacity = 0.3;
    if(this.value) {
      opacity = 1;
    }
    this.g.alpha = opacity;
  }
}

/*



*/
class Fader {
    constructor ({
      value = 0,    
      dimensions = {width:0, height: 0},
      position = {x: 0, y:0},
      callback = (value)=>{},
      graphic = new createjs.Shape()
    }) {
      this.value = value;
      this.dimensions = dimensions;
      this.position = position;
      this.callback = callback;
      this.g = new createjs.Container();
      this.handle = graphic;
      const bounds = this.handle.getBounds().clone();
      this.handle.regX = bounds.width *.5;
      this.handle.regY = bounds.height *.5;
      this.g.addChild( this.handle);
      this.setPosition(this.position);
      this.handle.on("pressmove", (evt)=>this.setValue(evt));
   }
    setValue(evt) {
        
        const pos = this.g.parent.globalToLocal(0,evt.stageY);
      
        
      
        if(pos.y > this.position.y && pos.y < this.position.y + this.dimensions.height ) {
          this.handle.y = pos.y;
          this.value = 1-(pos.y - this.position.y) / (this.dimensions.height);
        }
      
      
      
      this.callback(this.value);
    }
    // setValueFromPressMove (evt) { 
    //       this.value += (-evt.nativeEvent.movementY/128);
    //       if (this.value <= 0) { this.value = 0 }
    //       if (this.value >= 1) { this.value = 1 }
    // } 
    setPosition ({x,y}) {
      this.handle.x = x;
      this.handle.y = y;
    }
    draw() {
      var shape = new createjs.Shape();
      shape.name = "Handle";
      shape.graphics.beginFill("#000022").drawRect(0, 0, 30, 20);
      //shape.graphics.beginFill("#000000").drawCircle(0, -(diameter-(diameter/4)), diameter*0.15);
      return shape;
  }
}


/*



*/

class Pot {
  constructor ({
      value = 0, 
      callback = (value)=>{}, 
      mode = POTENTIOMETER_MODE.LINEAR, 
      position={x:0, y:0}, 
      graphic
  }) {
    this.value = value;
    this.callback = callback;
    this.mode = mode;
    this.g = graphic;// || this.draw({diameter: diameter});
    const bounds = this.g.getBounds().clone();
    //console.log("bounds",bounds)
    this.g.regX = bounds.width*.5;
    this.g.regY = bounds.height*.5;
    this.setPosition(position);
    this.setRotation();
    this.g.on("pressmove", (evt)=>this.setValue(evt));
  }
  
  setValue(evt) {
    this.setValueFromPressMove(evt); 
    this.setRotation();
    this.callback(this.value);
  }
  setValueFromPressMove(evt) {
    this.value += (-evt.nativeEvent.movementY/128);
    switch(this.mode) {
      case POTENTIOMETER_MODE.POLAR:
        if (this.value <= -1) {this.value = -1}
        if (this.value >= 1) { this.value = 1 }
      break;
      case POTENTIOMETER_MODE.LINEAR:
        if (this.value <= 0) { this.value = 0 }
        if (this.value >= 1) { this.value = 1 }
      break;
    }
  }
  setRotation() {
      switch(this.mode) {
      case POTENTIOMETER_MODE.POLAR:
        this.setRotationPolar();
      break;
      case POTENTIOMETER_MODE.LINEAR:
        this.setRotationLinear();
      break;
    }
  }
  setRotationPolar() {
    const rotate = Utils.lerp(0, 120, this.value);
    this.g.rotation = rotate;
  }
  setRotationLinear () {
    const rotate = Utils.lerp(-120, 120, this.value);
    this.g.rotation = rotate;
  }
  setPosition ({x,y}) {
    this.g.x = x;
    this.g.y = y;
  }
  draw({diameter}) {
      var shape = new createjs.Shape();
      shape.name = "PanPot";
      shape.graphics.beginFill("#ff0000").drawCircle(0, 0, diameter);
      shape.graphics.beginFill("#000000").drawCircle(0, -(diameter-(diameter/4)), diameter*0.15);
      return shape;
  }
}

function doSomething(value) {
  console.log(value);
}
/*



*/


class ChannelStrip {
  constructor ({
    id = 1, 
    position = {x: 0, y:0},
    callback = () => {},
    scale = 1,
    panelGraphic,
    faderGraphic,
    knobGraphic,
    muteGraphic,
    soloGraphic}) {
    this.id = id;
    this.label = `Channel ${id}`;
    this._fader = new Fader({
      position: {x: 120, y: 545},
      dimensions: {width: 0, height: 1165},
      callback: (value)=>callback(this.value), 
      graphic: faderGraphic,
    });
    this._pan = new Pot({
        callback: (value)=>callback(this.value), 
        value: 0,
        mode: POTENTIOMETER_MODE.POLAR, 
        position:{x:153, y:185}, 
        graphic: knobGraphic,
      });
    this._mute = new MixerSwitch({
      position: {x: 80, y: 2040},
      callback: (value)=>callback(this.value), 
      graphic: muteGraphic,
    });
    this._solo = new MixerSwitch({
      position: {x: 80, y: 2270},
      callback: (value)=>callback(this.value), 
      graphic: soloGraphic,
    });

    // this._auxSend1 = new Pot({
    //           position:{x:-10, y:240}, 
    //     diameter:15,
    //   callback: (value)=>doSomething(this.value),
    // });
    // this._auxSend2 = new Pot({
    //           position:{x:40, y:240}, 
    //     diameter:15,
    //   callback: (value)=>doSomething(this.value),
    // });
    
    this.panel = panelGraphic || new createjs.Shape();
      //this.panel.graphics.beginFill("#343434").drawRect(-35, -10, 100, 300);


    
    
    this._graphics = [this.panel, this._fader.g, this._pan.g, this._solo.g, this._mute.g, 
                     // this._auxSend1.g,           this._auxSend2.g
                     ];
    this.g = new createjs.Container();
    this.g.x = position.x;
    this.g.y = position.y;
    this.g.scaleX = scale;
    this.g.scaleY = scale;
    this.g.addChild(...this._graphics);
    
    
  }
  get value () {
    return {
      id: this.id,
      level: this._fader.value,
      pan : this._pan.value,
      solo: this._solo.value,
      mute: this._mute.value,
      // send1: this._auxSend1.value,
      // send2: this._auxSend2.value
    }
  }
}

class Mixer {
 
    constructor ({
              channels =  4,
              callback = ()=>{},
              panel,
              knob,
              fader,
              solo,
              mute,
              
            }) {
      
        this.channels = [];
        this.callback = callback;
        this.g = new createjs.Container();
        const channelBounds = panel.getBounds().clone();
        for(var i = 0; i<channels; i++) {
            let channel = Mixer.channelFactory({
              id: `Channel${i}`,
              panel, knob, mute, solo, fader,
              position: {x: (channelBounds.width+10) * i, y: 0 },
              callback: (value)=>this.processChange(value)
            });
            this.g.addChild(channel.g);
            this.channels.push(channel);
          
        }
      
    }
  
  processChange(value) {
      console.log("process",value);
    this.callback(value);
  }
  
  static channelFactory({id, panel, knob, mute, solo, fader, position, callback}) {
    console.log(position)
    return new ChannelStrip({id, 
                             position,
                             panelGraphic: panel.clone(),
                             knobGraphic: knob.clone(),
                             faderGraphic: fader.clone(),
                             soloGraphic: solo.clone(),
                             muteGraphic: mute.clone(),
                             callback
                            });
  }
  
}

// Add any assets you need to load here
var queue = new createjs.LoadQueue();
    queue.on("complete", init);
    queue.on("progress", progress);
    queue.loadManifest([
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/gLogo.png", id: "logo" },
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/Fader.png", id: "fader"},
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/Knob.png",  id: "knob"},
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/Plate.png", id: "panel"},
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/Mute.png",  id: "mute"},
          { src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/261096/Solo.png",  id: "solo"},
    ]);


var stage = new createjs.StageGL("canvas", {antialias: true});
stage.setClearColor("#101214")
    stage.updateViewport(window.innerWidth, window.innerHeight);

createjs.Touch.enable(stage);

// Add your monkey business here
var logo = null;
var bg = new createjs.Shape();
let mixer = null;
let mixerBounds = null;
function init(event) {
  stage.on("resize", resize);
  LabTemplate.setupStageResize(stage);
  LabTemplate.loadComplete();
  createjs.Ticker.on("tick", tick);
  
  bg = new createjs.Shape();
      bg.graphics.beginFill("#101214").drawRect(0, 0, stage.canvas.width, stage.canvas.height);
  
  const panel = new createjs.Bitmap(queue.getResult("panel"));
  const knob = new createjs.Bitmap(queue.getResult("knob"));
  const mute = new createjs.Bitmap(queue.getResult("mute"));
  const solo = new createjs.Bitmap(queue.getResult("solo"));
  const fader = new createjs.Bitmap(queue.getResult("fader"));
    console.log(panel)
  
  mixer = new Mixer({
    channels: 24,
    panel, knob, mute, solo, fader
  });
  mixerBounds = mixer.g.getBounds().clone();
  mixer.g.scaleX = window.innerHeight / mixerBounds.height;
  mixer.g.scaleY = window.innerHeight / mixerBounds.height;
  
  stage.addChild(bg,mixer.g)
}

// update your objects
function update() {
  stage.canvas.width = window.innerWidth;
  stage.canvas.height = window.innerHeight;
  stage.updateViewport(window.innerWidth, window.innerHeight);
    mixer.g.scaleX = window.innerHeight / mixerBounds.height;
  mixer.g.scaleY = window.innerHeight / mixerBounds.height;
}

// draw your objects
function draw() {
    
}

function tick(e) {
  if (createjs.Ticker.paused) { return; }
  update();
  draw();
  stage.update();
}

function resize () {
    //update();
    //draw();
    stage.update();
}

window.addEventListener("keydown", function() {
    togglePause();
});

function progress (e) {
  LabTemplate.loadProgress(e);
}

function togglePause() {
    createjs.Ticker.paused = !createjs.Ticker.paused;
    document.getElementById("pauseBtn").innerHTML = createjs.Ticker.paused ? "Resume" : "Pause";
}