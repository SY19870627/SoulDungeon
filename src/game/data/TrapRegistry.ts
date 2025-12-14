import { TrapConfig } from '../systems/GridSystem';

export const TRAP_DEFINITIONS: Record<string, TrapConfig> = {
    'spike': {
        id: 'spike',
        name: '尖刺坑',
        type: 'damage',
        color: 0xff0000,
        cost: 20,
        damage: 30,
        isScary: true,
        maxTriggers: -1,
        cooldown: 0,
        components: {
            triggers: [{ type: 'onStep' }],
            effects: [{ type: 'physical_damage' }]
        }
    },
    'bear_trap': {
        id: 'bear_trap',
        name: '捕獸夾',
        type: 'damage', // Logic type
        color: 0x553311, // Brown
        cost: 25,
        damage: 15,
        isScary: false,
        maxTriggers: 1,
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
        name: '魔法符文',
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
        name: '彈簧板',
        type: 'physics',
        color: 0x00ff00,
        cost: 30,
        pushDistance: 2,
        isScary: false,
        maxTriggers: 1,
        cooldown: 0
    },
    'oil': {
        id: 'oil',
        name: '油桶',
        type: 'elemental',
        color: 0x333333,
        cost: 10,
        element: 'oil',
        maxTriggers: -1,
        cooldown: 0,
        components: {
            triggers: [{ type: 'onStep' }],
            effects: [{ type: 'apply_status', config: { status: 'oiled', duration: 0 } }] // Duration 0 = infinite/manual remove
        }
    },
    'fire': {
        id: 'fire',
        name: '噴火口',
        type: 'damage',
        color: 0xff4500,
        cost: 15,
        damage: 10,
        element: 'fire',
        isScary: true,
        maxTriggers: -1,
        cooldown: 0
    },
    'burning_oil': {
        id: 'burning_oil',
        name: '烈焰地獄',
        type: 'damage',
        color: 0x8b0000, // Dark Red
        cost: 0,
        damage: 50,
        element: 'fire',
        isScary: true,
        maxTriggers: -1,
        cooldown: 0
    }
};

export const getTrapConfig = (id: string): TrapConfig | undefined => {
    return TRAP_DEFINITIONS[id];
};
