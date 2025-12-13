import { TrapConfig } from '../systems/GridSystem';

export const TRAP_DEFINITIONS: Record<string, TrapConfig> = {
    'spike': {
        id: 'spike',
        name: 'Spike',
        type: 'damage',
        color: 0xff0000,
        cost: 20,
        damage: 30,
        emoteSuccess: '😖',
        cooldown: 0,
        components: {
            triggers: [{ type: 'onStep' }],
            effects: [{ type: 'physical_damage' }]
        }
    },
    'bear_trap': {
        id: 'bear_trap',
        name: 'Bear Trap',
        type: 'damage', // Logic type
        color: 0x553311, // Brown
        cost: 25,
        damage: 15,
        emoteSuccess: '🗯️',
        cooldown: 5, // Single use? Or cooldown. Components handle logic.
        components: {
            triggers: [{ type: 'onStep' }],
            effects: [
                { type: 'physical_damage', config: { damage: 15 } },
                { type: 'root', config: { duration: 2.5 } }
            ]
        }
    },
    'rune': {
        id: 'rune',
        name: 'Magic Rune',
        type: 'elemental',
        color: 0x00ffff, // Cyan
        cost: 40,
        cooldown: 5,
        components: {
            triggers: [{ type: 'proximity', config: { radius: 1.5 } }],
            effects: [{ type: 'area_magic', config: { radius: 2.5, damage: 20 } }]
        }
    },
    'spring': {
        id: 'spring',
        name: 'Spring',
        type: 'physics',
        color: 0x00ff00,
        cost: 30,
        pushDistance: 2,
        emoteSuccess: '😱',
        emoteFail: '🤕',
        cooldown: 0
    },
    'oil': {
        id: 'oil',
        name: 'Oil',
        type: 'elemental',
        color: 0x333333,
        cost: 10,
        element: 'oil',
        cooldown: 0
    },
    'fire': {
        id: 'fire',
        name: 'Fire',
        type: 'damage',
        color: 0xff4500,
        cost: 15,
        damage: 10,
        element: 'fire',
        cooldown: 0
    },
    'inferno': {
        id: 'inferno',
        name: 'Inferno',
        type: 'damage',
        color: 0x8b0000, // Dark Red
        cost: 0, // Not purchasable directly
        damage: 50,
        element: 'fire',
        emoteSuccess: '🔥',
        cooldown: 0
    }
};

export const getTrapConfig = (id: string): TrapConfig | undefined => {
    return TRAP_DEFINITIONS[id];
};
