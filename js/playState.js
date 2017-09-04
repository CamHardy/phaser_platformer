PlayState = {};

const LEVEL_COUNT = 2;

PlayState.init = function (data) {
	keys = game.input.keyboard.addKeys({
		left: Phaser.KeyCode.LEFT,
		right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
	});

	coinPickupCount = 0;
    hasKey = false;
    level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.create = function () {
	// create sfx
	sfx = {
		jump: game.add.audio('sfx:jump', 0.5),
        coin: game.add.audio('sfx:coin', 0.5),
        stomp: game.add.audio('sfx:stomp', 0.5),
        key: game.add.audio('sfx:key', 0.5),
        door: game.add.audio('sfx:door', 0.5)
	};

	// create level
	game.add.image(0, 0, 'background');
	this._loadLevel(game.cache.getJSON(`level:${level}`));
    this._createHud();
};

PlayState.update = function () {
	this._handleCollisions();
	this._handleInput();

	// update scoreboard (and door)
	coinFont.text = `x${coinPickupCount}`;
    keyIcon.frame = hasKey ? 1 : 0;
    door.frame = hasKey ? 1 : 0;
};

PlayState._loadLevel = function (data) {
	// fade in from black
	game.camera.flash('#000000');

    // create all the groups/layers that we need
    bgDecoration = game.add.group();
    platforms = game.add.group();
    coins = game.add.group();
    spiders = game.add.group();
    enemyWalls = game.add.group();
    enemyWalls.visible = false;

	// spawn all platforms and coins
	data.platforms.forEach(this._spawnPlatform, this);
	data.coins.forEach(this._spawnCoin, this);

	// spawn decorations
	data.decoration.forEach(function (deco) {
		bgDecoration.add(game.add.image(deco.x, deco.y, 'decoration', deco.frame));
	});

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
	let sprite = platforms.create(platform.x, platform.y, platform.image);
    game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
	let sprite = enemyWalls.create(x, y, 'invisible-wall');
	sprite.anchor.set(side === 'left' ? 1 : 0, 1);
	game.physics.enable(sprite);
	sprite.body.immovable = true;
	sprite.body.allowGravity = false;
};

PlayState._spawnCoin = function (coin) {
	let sprite = coins.create(coin.x, coin.y, 'coin');
	sprite.anchor.set(0.5, 0.5);
	sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6 fps, looped
	sprite.animations.play('rotate');
	game.physics.enable(sprite);
	sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
	// spawn hero
	hero = new Hero(game, data.hero.x, data.hero.y);
	game.add.existing(hero);

	data.spiders.forEach(function (spider) {
		let sprite = new Spider(game, spider.x, spider.y);
		spiders.add(sprite);
	});
};

PlayState._spawnDoor = function (x, y) {
	door = bgDecoration.create(x, y, 'door');
	door.anchor.setTo(0.5, 1);
	game.physics.enable(door);
	door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
	key = bgDecoration.create(x, y, 'key');
	key.anchor.set(0.5, 0.5);
	game.physics.enable(key);
	key.body.allowGravity = false;
	key.y -= 3;
	game.add.tween(key)
		.to({y: key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
		.yoyo(true)
		.loop()
		.start();
};

PlayState._handleCollisions = function () {
    game.physics.arcade.collide(hero, platforms);
    game.physics.arcade.collide(spiders, platforms);
    game.physics.arcade.collide(spiders, enemyWalls);

    // pick up coins
    game.physics.arcade.overlap(hero, coins, this._onHeroVsCoin)
    // someone has to die
    game.physics.arcade.overlap(hero, spiders, this._onHeroVsEnemy);
    // unlock door
    game.physics.arcade.overlap(hero, key, this._onHeroVsKey);
    // exit level
    game.physics.arcade.overlap(hero, door, this._onHeroVsDoor, function (hero, door) {
    	return hasKey && hero.body.touching.down;
    });
};

PlayState._handleInput = function () {
	// move hero left
	if (keys.left.isDown) {
		hero.move(-1);
	}
	// move hero right
	else if (keys.right.isDown) {
		hero.move(1);
	}
	// stop
    else {
        hero.move(0);
    }

    keys.up.onDown.add(function () {
        let didJump = hero.jump();
        if (didJump) {
            sfx.jump.play();
        }
    });
};

PlayState._onHeroVsCoin = function (hero, coin) {
	sfx.coin.play();
	coin.kill();
	coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
	// if hero is falling, the enemy dies
	if (hero.body.velocity.y > 0) {
		hero.bounce();
		sfx.stomp.play();
		enemy.die()
	}
	// otherwise the hero dies
	else {
		sfx.stomp.play();
		hero.die();
		hero.events.onKilled.addOnce(function () {
			game.camera.fade('#000000');
		});
		game.camera.onFadeComplete.addOnce(function () {
			game.state.restart(true, false, {level: level});
		});
		enemy.body.touching = enemy.body.wasTouching;
	}
};

PlayState._onHeroVsKey = function (hero, key) {
	sfx.key.play();
	key.kill();
	hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
	hero.body.enable = false;
	sfx.door.play();

	// play 'enter door' animation and load next level
	tween = game.add.tween(hero)
		.to({x: door.x, alpha: 0}, 500, null, true);
	tween.onComplete.addOnce(function () {
		game.camera.fade('#000000');
	});
	game.camera.onFadeComplete.addOnce(function () {
		game.state.start('play', true, false, {level: level + 1});
	});
};

PlayState._createHud = function () {
	keyIcon = game.make.image(0, 19, 'icon:key');
	keyIcon.anchor.set(0, 0.5);

	const NUMBERS_STR = '0123456789X ';
	coinFont = game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
	let coinIcon = game.make.image(keyIcon.width + 7, 0, 'icon:coin');
	

	let coinScoreImg = game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, coinFont);
	coinScoreImg.anchor.set(0, 0.5);

	hud = game.add.group();
	hud.add(coinIcon);
	hud.add(keyIcon);
	hud.position.set(10, 10);
	hud.add(coinScoreImg);
};