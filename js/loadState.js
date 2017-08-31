LoadState = {};

LoadState.init = function () {
	// round pixels (no anti-aliasing)
	game.renderer.renderSession.roundPixels = true;
};

LoadState.preload = function () {
	// load levels
	game.load.json('level:0', 'data/level00.json');
	game.load.json('level:1', 'data/level01.json');

	// load images
	game.load.image('background', 'assets/images/background.png');
	game.load.image('ground', 'assets/images/ground.png');
	game.load.image('grass:8x1', 'assets/images/grass_8x1.png');
	game.load.image('grass:6x1', 'assets/images/grass_6x1.png');
	game.load.image('grass:4x1', 'assets/images/grass_4x1.png');
	game.load.image('grass:2x1', 'assets/images/grass_2x1.png');
	game.load.image('grass:1x1', 'assets/images/grass_1x1.png');
	game.load.image('invisible-wall', 'assets/images/invisible_wall.png');
    game.load.image('icon:coin', 'assets/images/coin_icon.png');
    game.load.image('key', 'assets/images/key.png');
    game.load.image('font:numbers', 'assets/images/numbers.png');

    // load spritesheets
    game.load.spritesheet('hero', 'assets/images/hero.png', 36, 42);
    game.load.spritesheet('coin', 'assets/images/coin_animated.png', 22, 22);
    game.load.spritesheet('spider', 'assets/images/spider.png', 42, 32);
    game.load.spritesheet('door', 'assets/images/door.png', 42, 66);
    game.load.spritesheet('icon:key', 'assets/images/key_icon.png', 34, 30);

    // load audio
    game.load.audio('sfx:jump', 'assets/audio/jump.wav');
    game.load.audio('sfx:coin', 'assets/audio/coin.wav');
    game.load.audio('sfx:stomp', 'assets/audio/stomp.wav');
    game.load.audio('sfx:key', 'assets/audio/key.wav');
    game.load.audio('sfx:door', 'assets/audio/door.wav');
    game.load.audio('bgm', 'assets/audio/bgm.mp3');
};

LoadState.create = function () {
	// create bgm
	bgm = game.add.audio('bgm');
	bgm.loopFull();
	
	game.state.start('play', true, false, {level: 0});
};