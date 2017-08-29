Spider.SPEED = 100;

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

Spider.prototype.die = function () {
	this.body.enable = false;

	this.animations.play('die').onComplete.addOnce(function () {
		this.kill();
	}, this);
};