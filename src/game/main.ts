import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

function preload(this: Phaser.Scene) {
    // this.load.image('logo', 'assets/logo.png');
}

function create(this: Phaser.Scene) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(100, 100, 100, 100);

    this.add.text(100, 220, 'Phaser Canvas', { color: '#00ff00' });
}

function update(this: Phaser.Scene) {
    // Game loop
}
