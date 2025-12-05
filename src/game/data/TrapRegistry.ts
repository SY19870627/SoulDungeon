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
        cooldown: 0
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
    'water': {
        id: 'water',
        name: 'Water',
        type: 'elemental',
        color: 0x3498db,
        cost: 10,
        element: 'water',
        cooldown: 0
    },
    'lightning': {
        id: 'lightning',
        name: 'Lightning',
        type: 'damage',
        color: 0xf1c40f,
        cost: 25,
        damage: 15,
        element: 'lightning',
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
    },
    'electric_swamp': {
        id: 'electric_swamp',
        name: 'Electric Swamp',
        type: 'damage',
        color: 0x8e44ad, // Purple
        cost: 0, // Not purchasable directly
        damage: 20,
        element: 'lightning',
        emoteSuccess: '⚡',
        cooldown: 0
    }
};

export const getTrapConfig = (id: string): TrapConfig | undefined => {
    return TRAP_DEFINITIONS[id];
};
