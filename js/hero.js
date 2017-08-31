function Hero(game, x, y) {
	// call Phaser.Sprite constructor
	Phaser.Sprite.call(this, game, x, y, 'hero');
	this.anchor.set(0.5, 0.5);
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true);
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
}

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
	const SPEED = 200;
    this.body.velocity.x = direction * SPEED;

    // make the sprite face the direction of movement
    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;
    
    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

Hero.prototype.bounce = function () {
	const BOUNCE_SPEED = 200;
	this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype.update = function () {
    let currentAnimation = 'stop'; // default animation

    // jumping
    if (this.body.velocity.y < 0) {
        currentAnimation = 'jump';
    }

    // falling
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        currentAnimation = 'fall';
    }

    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        currentAnimation = 'run';
    }

    // update the sprite animation if necessary
    if (this.animations.name !== currentAnimation) {
        this.animations.play(currentAnimation);
    }
}