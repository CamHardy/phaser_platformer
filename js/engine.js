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
    game.physics.arcade.overlap(hero, spiders, _onHeroVsEnemy);
}

function _handleInput() {
	if (keys.left.isDown) {
		hero.move(-1);
		if (!sfx.walk.isPlaying) {
			sfx.walk.play();
		}
	}
	else if (keys.right.isDown) {
		hero.move(1);
		sfx.walk.stop();
	}
    else {
        hero.move(0);
		sfx.walk.stop();
    }
}

function _onHeroVsCoin(hero, coin) {
	sfx.coin.play();
	coin.kill();
	coinPickupCount++;
}

function _onHeroVsEnemy(hero, enemy) {
	// if hero is falling, the enemy dies
	if (hero.body.velocity.y > 0) {
		hero.bounce();
		sfx.stomp.play();
		enemy.die()
	}
	// otherwise the hero dies
	else {
		sfx.stomp.play();
		game.state.restart();
	}
}

function _createHud() {
	const NUMBERS_STR = '0123456789X ';
	coinFont = game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);
	let coinIcon = game.make.image(0, 0, 'icon:coin');

	let coinScoreImg = game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, coinFont);
	coinScoreImg.anchor.set(0, 0.5);

	hud = game.add.group();
	hud.add(coinIcon);
	hud.position.set(10, 10);
	hud.add(coinScoreImg);
}