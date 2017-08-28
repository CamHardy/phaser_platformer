function Hero(game, x, y) {
	// call Phaser.Sprite constructor
	Phaser.Sprite.call(this, game, x, y, 'hero');
	this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
}

function Spider(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'spider');
	this.anchor.set(0.5);
	this.animations.add('crawl', [0, 1, 2], 8, true);
	this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
	this.animations.play('crawl');
	this.game.physics.enable(this);
	this.body.collideWorldBounds = true;
	this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
	const SPEED = 200;
    this.body.velocity.x = direction * SPEED;
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;
    
    if(canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

// inherit from Phaser.Sprite
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
	// check for wall and reverse direction if necessary
	if (this.body.touching.right || this.body.blocked.right) {
		this.body.velocity.x = -Spider.SPEED; // turn left
	}
	else if (this.body.touching.left || this.body.blocked.left) {
		this.body.velocity.x = Spider.SPEED; // turn right
	}
};


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
    game.load.audio('sfx:jump', 'assets/audio/jump.wav');
    game.load.spritesheet('coin', 'assets/images/coin_animated.png', 22, 22);
    game.load.spritesheet('spider', 'assets/images/spider.png', 42, 32);
    game.load.audio('sfx:coin', 'assets/audio/coin.wav');
}

function create() {
    // create sound entities
    sfx = {
        jump: game.add.audio('sfx:jump'),
        coin: game.add.audio('sfx:coin')
    };
	game.add.image(0, 0, 'background');
	_loadLevel(game.cache.getJSON('level:1'));
}

function update() {
    _handleCollisions();
	_handleInput();
}

function _loadLevel(data) {
    // create all the groups/layers that we need
    platforms = game.add.group();
    coins = game.add.group();
    spiders = game.add.group();
    enemyWalls = game.add.group();
    enemyWalls.visible = false;

	// spawn all platforms and coins
	data.platforms.forEach(_spawnPlatform);
	data.coins.forEach(_spawnCoin);

	// spawn hero and enemies
	_spawnCharacters({hero: data.hero, spiders: data.spiders});

    // enable gravity
    const GRAVITY = 1200;
    game.physics.arcade.gravity.y = GRAVITY;
}

function _spawnPlatform(platform) {
	let sprite = platforms.create(platform.x, platform.y, platform.image);
    game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    _spawnEnemyWall(platform.x, platform.y, 'left');
    _spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
}

function _spawnEnemyWall(x, y, side) {
	let sprite = enemyWalls.create(x, y, 'invisible-wall');
	sprite.anchor.set(side === 'left' ? 1 : 0, 1);
	game.physics.enable(sprite);
	sprite.body.immovable = true;
	sprite.body.allowGravity = false;
}

function _spawnCoin(coin) {
	let sprite = coins.create(coin.x, coin.y, 'coin');
	sprite.anchor.set(0.5, 0.5);
	sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6 fps, looped
	sprite.animations.play('rotate');
	game.physics.enable(sprite);
	sprite.body.allowGravity = false;
}

function _spawnCharacters(data) {
	// spawn hero
	hero = new Hero(game, data.hero.x, data.hero.y);
	game.add.existing(hero);

	data.spiders.forEach(function (spider) {
		let sprite = new Spider(game, spider.x, spider.y);
		spiders.add(sprite);
	});
}

function _handleCollisions() {
    game.physics.arcade.collide(hero, platforms);
    game.physics.arcade.overlap(hero, coins, _onHeroVsCoin)
    game.physics.arcade.collide(spiders, platforms);
    game.physics.arcade.collide(spiders, enemyWalls);
}

function _handleInput() {
	if (keys.left.isDown) {
		hero.move(-1);
	}
	else if (keys.right.isDown) {
		hero.move(1);
	}
    else {
        hero.move(0);
    }
}

function _onHeroVsCoin(hero, coin) {
	sfx.coin.play();
	coin.kill();
}

// program entry point
var game = new Phaser.Game(960, 600, Phaser.AUTO, 'game', {
	init: init,
	preload: preload,
	create: create,
	update: update
});