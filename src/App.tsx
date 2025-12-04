import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

function App() {
    const gameRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!gameRef.current) return

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
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
        }

        const game = new Phaser.Game(config)

        function preload(this: Phaser.Scene) {
            // this.load.image('logo', 'path/to/logo.png');
        }

        function create(this: Phaser.Scene) {
            const text = this.add.text(400, 300, 'Soul Dungeon\nPhaser + React + Electron', {
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            });
            text.setOrigin(0.5);
        }

        function update(this: Phaser.Scene) {
            // Game loop
        }

        return () => {
            game.destroy(true)
        }
    }, [])

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px', background: '#333', color: 'white' }}>
                <h1>Soul Dungeon Manager</h1>
                <button onClick={() => alert('React Button Clicked!')}>React UI Button</button>
            </div>
            <div ref={gameRef} style={{ flex: 1, background: '#000' }} />
        </div>
    )
}

export default App
