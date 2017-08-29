function init() {
	game.renderer.renderSession.roundPixels = true;
	keys = game.input.keyboard.addKeys({
		left: Phaser.KeyCode.LEFT,
		right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
	});

    keys.up.onDown.add(function () {
        let didJump = hero.jump();
        if (didJump) {
            sfx.jump.play();
        }
    });

    coinPickupCount = 0;
}

function preload() {
	game.load.json('level:1', 'data/level01.json');
	game.load.image('background', 'assets/images/background.png');
	game.load.image('ground', 'assets/images/ground.png');
	game.load.image('grass:8x1', 'assets/images/grass_8x1.png');
	game.load.image('grass:6x1', 'assets/images/grass_6x1.png');
	game.load.image('grass:4x1', 'assets/images/grass_4x1.png');
	game.load.image('grass:2x1', 'assets/images/grass_2x1.png');
	game.load.image('grass:1x1', 'assets/images/grass_1x1.png');
	game.load.image('hero', 'assets/images/hero_stopped.png');
	game.load.image('invisible-wall', 'assets/images/invisible_wall.png');
    game.load.image('icon:coin', 'assets/images/coin_icon.png');
    game.load.image('font:numbers', 'assets/images/numbers.png');
    game.load.audio('sfx:jump', 'assets/audio/jump.wav');
    game.load.spritesheet('coin', 'assets/images/coin_animated.png', 22, 22);
    game.load.spritesheet('spider', 'assets/images/spider.png', 42, 32);
    game.load.audio('sfx:coin', 'assets/audio/coin.wav');
    game.load.audio('sfx:stomp', 'assets/audio/stomp.wav');
}

function create() {
    // create sound entities
    sfx = {
        jump: game.add.audio('sfx:jump'),
        coin: game.add.audio('sfx:coin'),
        stomp: game.add.audio('sfx:stomp')
    };
	game.add.image(0, 0, 'background');
	_loadLevel(game.cache.getJSON('level:1'));
    _createHud();
}

function update() {
    _handleCollisions();
	_handleInput();
    coinFont.text = `x${coinPickupCount}`;
}