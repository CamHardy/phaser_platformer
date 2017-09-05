'use strict';

var PlayState = {};

const LEVEL_COUNT = 2;

PlayState.init = function (data) {
	this.keys = game.input.keyboard.addKeys({
		left: Phaser.KeyCode.LEFT,
		right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
	});

	this.coinPickupCount = 0;
    this.hasKey = false;
    this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.create = function () {
	// create sfx
	this.sfx = {
		jump: game.add.audio('sfx:jump', 0.5),
        coin: game.add.audio('sfx:coin', 0.5),
        stomp: game.add.audio('sfx:stomp', 0.5),
        key: game.add.audio('sfx:key', 0.5),
        door: game.add.audio('sfx:door', 0.5)
	};

	// create level
	game.add.image(0, 0, 'background');
	this._loadLevel(game.cache.getJSON(`level:${this.level}`));
    this._createHud();
};

PlayState.update = function () {
	this._handleCollisions();
	this._handleInput();

	// update scoreboard (and door)
	this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = this.hasKey ? 1 : 0;
    this.door.frame = this.hasKey ? 1 : 0;
};

PlayState._loadLevel = function (data) {
	// fade in from black
	game.camera.flash('#000000');

    // create all the groups/layers that we need
    this.bgDecoration = game.add.group();
    this.platforms = game.add.group();
    this.coins = game.add.group();
    this.spiders = game.add.group();
    this.enemyWalls = game.add.group();
    this.enemyWalls.visible = false;

	// spawn all platforms and coins
	data.platforms.forEach(this._spawnPlatform, this);
	data.coins.forEach(this._spawnCoin, this);

	// spawn decorations
	data.decoration.forEach(function (deco) {
		this.bgDecoration.add(game.add.image(deco.x, deco.y, 'decoration', deco.frame));
	}, this);

	// spawn exit door and key
	this._spawnDoor(data.door.x, data.door.y);
	this._spawnKey(data.key.x, data.key.y);

	// spawn hero and enemies
	this._spawnCharacters({hero: data.hero, spiders: data.spiders});

    // enable gravity
    const GRAVITY = 1200;
    game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
	let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
	let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
	sprite.anchor.set(side === 'left' ? 1 : 0, 1);
	game.physics.enable(sprite);
	sprite.body.immovable = true;
	sprite.body.allowGravity = false;
};

PlayState._spawnCoin = function (coin) {
	let sprite = this.coins.create(coin.x, coin.y, 'coin');
	sprite.anchor.set(0.5, 0.5);
	sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6 fps, looped
	sprite.animations.play('rotate');
	game.physics.enable(sprite);
	sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
	// spawn hero
	this.hero = new Hero(game, data.hero.x, data.hero.y);
	game.add.existing(this.hero);

	data.spiders.forEach(function (spider) {
		let sprite = new Spider(game, spider.x, spider.y);
		this.spiders.add(sprite);
	}, this);
};

PlayState._spawnDoor = function (x, y) {
	this.door = this.bgDecoration.create(x, y, 'door');
	this.door.anchor.setTo(0.5, 1);
	game.physics.enable(this.door);
	this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
	this.key = this.bgDecoration.create(x, y, 'key');
	this.key.anchor.set(0.5, 0.5);
	game.physics.enable(this.key);
	this.key.body.allowGravity = false;
	this.key.y -= 3;
	game.add.tween(this.key)
		.to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
		.yoyo(true)
		.loop()
		.start();
};

PlayState._handleCollisions = function () {
    game.physics.arcade.collide(this.hero, this.platforms);
    game.physics.arcade.collide(this.spiders, this.platforms);
    game.physics.arcade.collide(this.spiders, this.enemyWalls);

    // pick up coins
    game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this)
    // someone has to die
    game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
    // unlock door
    game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this);
    // exit level
    game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor, function (hero, door) {
    	return this.hasKey && hero.body.touching.down;
    }, this);
};

PlayState._handleInput = function () {
	// move hero left
	if (this.keys.left.isDown) {
		this.hero.move(-1);
	}
	// move hero right
	else if (this.keys.right.isDown) {
		this.hero.move(1);
	}
	// stop
    else {
        this.hero.move(0);
    }

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);
};

PlayState._onHeroVsCoin = function (hero, coin) {
	this.sfx.coin.play();
	coin.kill();
	this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
	// if hero is falling, the enemy dies
	if (hero.body.velocity.y > 0) {
		hero.bounce();
		this.sfx.stomp.play();
		enemy.die()
	}
	// otherwise the hero dies
	else {
		this.sfx.stomp.play();
		hero.die();
		hero.events.onKilled.addOnce(function () {
			game.camera.fade('#000000');
		});
		game.camera.onFadeComplete.addOnce(function () {
			game.state.restart(true, false, {level: this.level});
		}, this);
		enemy.body.touching = enemy.body.wasTouching;
	}
};

PlayState._onHeroVsKey = function (hero, key) {
	this.sfx.key.play();
	key.kill();
	this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
	hero.body.enable = false;
	this.sfx.door.play();

	// play 'enter door' animation and load next level
	game.add.tween(hero)
		.to({x: door.x, alpha: 0}, 500, null, true);
	game.camera.fade('#000000');
	game.camera.onFadeComplete.addOnce(function () {
		game.state.start('play', true, false, {level: this.level + 1});
	}, this);
};

PlayState._createHud = function () {
	this.keyIcon = game.make.image(0, 19, 'icon:key');
	this.keyIcon.anchor.set(0, 0.5);

	const NUMBERS_STR = '0123456789X ';
	this.coinFont = game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
	let coinIcon = game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
	

	let coinScoreImg = game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
	coinScoreImg.anchor.set(0, 0.5);

	this.hud = game.add.group();
	this.hud.add(coinIcon);
	this.hud.add(this.keyIcon);
	this.hud.position.set(10, 10);
	this.hud.add(coinScoreImg);
};