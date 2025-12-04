import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { Sidebar } from './components/Sidebar'
import { ToolType } from './data/tools'
import { MainScene } from './game/scenes/MainScene'

function App() {
    const gameRef = useRef<HTMLDivElement>(null)
    const gameInstanceRef = useRef<Phaser.Game | null>(null)
    const [currentTool, setCurrentTool] = useState<ToolType>('spring')

    // Initialize Game
    useEffect(() => {
        if (!gameRef.current) return

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            backgroundColor: '#1a1a1a',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: true
                }
            },
            scene: [MainScene]
        }

        const game = new Phaser.Game(config)
        gameInstanceRef.current = game;

        return () => {
            game.destroy(true)
            gameInstanceRef.current = null;
        }
    }, [])

    // Sync Tool State to Phaser
    useEffect(() => {
        if (gameInstanceRef.current) {
            gameInstanceRef.current.events.emit('tool-changed', currentTool);
        }
    }, [currentTool])

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden' }}>
            <Sidebar currentTool={currentTool} onSelectTool={setCurrentTool} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px', background: '#222', color: 'white', borderBottom: '1px solid #444' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#b19cd9' }}>
                        目前選擇工具: {currentTool}
                    </h2>
                </div>
                <div ref={gameRef} style={{ flex: 1, background: '#000', overflow: 'hidden' }} />
            </div>
        </div>
    )
}

export default App
