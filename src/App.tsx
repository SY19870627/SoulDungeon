import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameConfig } from './game/main'
import { Trap } from './game/systems/GridSystem'

const TRAPS: Trap[] = [
    { type: 'spike', name: 'Spike', color: 0xff0000, cost: 20 },
    { type: 'spring', name: 'Spring', color: 0x0000ff, cost: 30 },
]

function App() {
    const gameRef = useRef<Phaser.Game | null>(null)
    const [selectedTool, setSelectedTool] = useState<string>('wall')
    const [gold, setGold] = useState<number>(100)

    useEffect(() => {
        if (gameRef.current === null) {
            gameRef.current = new Phaser.Game(GameConfig)
        }

        const handleGoldUpdate = (e: any) => {
            setGold(e.detail)
        }
        window.addEventListener('gold-updated', handleGoldUpdate)

        return () => {
            window.removeEventListener('gold-updated', handleGoldUpdate)
            // Optional: Cleanup game instance on unmount
            // gameRef.current?.destroy(true)
        }
    }, [])

    const selectTool = (tool: string, trap: Trap | null) => {
        setSelectedTool(tool)
        const event = new CustomEvent('select-trap', { detail: trap })
        window.dispatchEvent(event)
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex' }}>
            <div style={{
                width: '200px',
                backgroundColor: '#333',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderRight: '1px solid #555',
                zIndex: 10
            }}>
                <h2 style={{ color: 'white', marginBottom: '10px' }}>Soul Dungeon</h2>
                <div style={{ color: '#f1c40f', fontSize: '1.2em', marginBottom: '20px', fontWeight: 'bold' }}>
                    Gold: {gold}
                </div>

                <h3 style={{ color: 'white', marginBottom: '10px' }}>Tools</h3>

                <button
                    onClick={() => selectTool('wall', null)}
                    style={{
                        padding: '10px',
                        backgroundColor: selectedTool === 'wall' ? '#666' : '#444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Wall (10g)
                </button>

                {TRAPS.map(trap => (
                    <button
                        key={trap.type}
                        onClick={() => selectTool(trap.type, trap)}
                        style={{
                            padding: '10px',
                            backgroundColor: selectedTool === trap.type ? '#666' : '#444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{trap.name}</span>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#' + trap.color.toString(16).padStart(6, '0'),
                            borderRadius: '50%',
                            display: 'inline-block'
                        }}></span>
                        <span style={{ fontSize: '0.8em', color: '#aaa' }}>{trap.cost}g</span>
                    </button>
                ))}

                <div style={{ height: '20px' }}></div>

                <button
                    onClick={() => window.dispatchEvent(new Event('start-wave'))}
                    style={{
                        padding: '10px',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Start Wave
                </button>
            </div>

            <div id="game-container" style={{ flex: 1, height: '100%', position: 'relative' }}></div>

            <div style={{ position: 'absolute', top: 10, right: 10, padding: '10px', color: 'white', pointerEvents: 'none' }}>
                <p>Selected: {selectedTool}</p>
            </div>
        </div>
    )
}

export default App
