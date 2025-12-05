import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { GameConfig } from './game/main'

function App() {
    const gameRef = useRef<Phaser.Game | null>(null)

    useEffect(() => {
        if (gameRef.current === null) {
            gameRef.current = new Phaser.Game(GameConfig)
        }

        return () => {
            // Optional: Cleanup game instance on unmount
            // gameRef.current?.destroy(true)
        }
    }, [])

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <div id="game-container" style={{ width: '100%', height: '100%' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', color: 'white', pointerEvents: 'none' }}>
                <h1>Soul Dungeon UI Overlay</h1>
                <p>React UI + Phaser Game</p>
            </div>
        </div>
    )
}

export default App
