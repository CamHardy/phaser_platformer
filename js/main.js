'use strict';

var game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
game.state.add('play', PlayState);
game.state.add('load', LoadState);
game.state.start('load');