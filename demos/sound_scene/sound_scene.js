let stage = new createjs.Stage("mainCanvas");

stage.enableMouseOver();

let noon = new createjs.Sample("../../spikes/assets/test.ogg");

let ssData = {
	images: ["./assets/SoundJS-demo-1-stories.png"],
	frames: {width: 240, height: 240},
	animations: {
		mouse: [0,1],
		milk: [2,4],
		book: [5,6],
		fish: [7,8],
		scratch: [9,10]
	}
};

let storySprites = new createjs.SpriteSheet(ssData);

ssData = {
	images: ["./assets/SoundJS-demo-1-cat.png"],
	frames: {width: 460, height: 330}
};

let kittySprites = new createjs.SpriteSheet(ssData);

stage.update();

/*var data = {
	images: ["sprites.jpg"],
	frames: {width:50, height:50},
	animations: {
		stand:0,
		run:[1,5],
		jump:[6,8,"run"]
	}
};
var spriteSheet = new createjs.SpriteSheet(data);
var animation = new createjs.Sprite(spriteSheet, "run");*/

let clk = createClickable(storySprites, 0, null, 1, 50, 100, 240, 240);
clk.addEventListener("click", () => noon.play() );


function createClickable(spriteSheet, restFrame, overFrame, clickFrame, x, y, hitboxWidth, hitboxHeight){
	let clickable = new createjs.Container();
	clickable.x = x;
	clickable.y = y;

	stage.addChild(clickable);

	let sprite = new createjs.Sprite(spriteSheet);
	sprite.gotoAndStop(restFrame);
	clickable.addChild(sprite);

	let clickArea = new createjs.Shape();
	clickArea.graphics.beginFill("rgba(0,0,0,0.01)");
	clickArea.graphics.drawRect(0,0, hitboxWidth, hitboxHeight);
	clickArea.x = x;
	clickArea.y = y;
	clickArea.cursor = "pointer";
	clickable.addChild(clickArea);


	clickArea.addEventListener("mousedown", () => {sprite.gotoAndStop(clickFrame); stage.update();} );
	clickArea.addEventListener("pressup", () => {sprite.gotoAndStop(restFrame); stage.update();} );

	stage.update();
	return clickable;
}
