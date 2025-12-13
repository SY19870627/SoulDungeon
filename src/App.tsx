import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameConfig } from './game/main'
import { TrapConfig } from './game/systems/GridSystem'
import { TRAP_DEFINITIONS } from './game/data/TrapRegistry'

function App() {
    const gameRef = useRef<Phaser.Game | null>(null)
    const [selectedTool, setSelectedTool] = useState<string>('wall')
    const [currentTrapId, setCurrentTrapId] = useState<string | null>(null)
    const [gold, setGold] = useState<number>(500)

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

    const selectTool = (tool: string, trapConfig: TrapConfig | null) => {
        setSelectedTool(tool)
        setCurrentTrapId(trapConfig ? trapConfig.id : null)
        const event = new CustomEvent('tool-changed', { detail: { tool, trapConfig } })
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
                <h2 style={{ color: 'white', marginBottom: '10px' }}>靈魂地城</h2>
                <div style={{ color: '#f1c40f', fontSize: '1.2em', marginBottom: '20px', fontWeight: 'bold' }}>
                    金幣: {gold}
                </div>

                <h3 style={{ color: 'white', marginBottom: '10px' }}>建造工具</h3>

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
                    牆壁 (10g)
                </button>

                {Object.values(TRAP_DEFINITIONS).filter(t => t.cost > 0).map(trap => (
                    <button
                        key={trap.id}
                        onClick={() => selectTool('trap', trap)}
                        style={{
                            padding: '10px',
                            backgroundColor: (selectedTool === 'trap' && currentTrapId === trap.id) ? '#666' : '#444',
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

                <button
                    onClick={() => selectTool('sell', null)}
                    style={{
                        padding: '10px',
                        backgroundColor: selectedTool === 'sell' ? '#c0392b' : '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    拆除 (退費)
                </button>

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
                    開始進攻
                </button>
            </div>

            <div id="game-container" style={{ flex: 1, height: '100%', position: 'relative' }}></div>

            <div style={{ position: 'absolute', top: 10, right: 10, padding: '10px', color: 'white', pointerEvents: 'none' }}>
                <p>當前選擇: {selectedTool === 'wall' ? '牆壁' : (selectedTool === 'sell' ? '拆除' : (currentTrapId ? '陷阱' : selectedTool))}</p>
            </div>
        </div>
    )
}

export default App
