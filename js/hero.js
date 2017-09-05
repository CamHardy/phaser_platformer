'use strict';

function Hero(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, 'hero');

    // anchor point
	this.anchor.set(0.5, 0.5);

    // animations
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true);
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
    this.animations.add('die', [5, 6, 5, 6, 5, 6, 5, 6], 12);

    // physics properties
    game.physics.enable(this);
    this.body.collideWorldBounds = true;
    
    this.currentAnimation = 'stop'; // default animation
    this.alive = true;
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
    let canJump = this.body.touching.down && this.alive;
    
    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

Hero.prototype.bounce = function () {
	const BOUNCE_SPEED = 200;
	this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype.die = function () {
    this.alive = false;
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
}

Hero.prototype.update = function () {
    // dead
    if(!this.alive) {
        this.currentAnimation = 'die';
    }

    // jumping
    else if (this.body.velocity.y < 0) {
        this.currentAnimation = 'jump';
    }

    // falling
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        this.currentAnimation = 'fall';
    }

    // running
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        this.currentAnimation = 'run';
    }

    // standing
    else {
        this.currentAnimation = 'stop';
    }

    // update the sprite animation if necessary
    if (this.animations.name !== this.currentAnimation) {
        this.animations.play(this.currentAnimation);
    }
}