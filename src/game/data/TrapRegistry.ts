import { TrapConfig } from '../systems/GridSystem';

export const TRAP_DEFINITIONS: Record<string, TrapConfig> = {
    'spike': {
        id: 'spike',
        name: 'Spike',
        type: 'damage',
        color: 0xff0000,
        cost: 20,
        damage: 30,
        cooldown: 0
    },
    'spring': {
        id: 'spring',
        name: 'Spring',
        type: 'physics',
        color: 0x00ff00,
        cost: 30,
        pushDistance: 2,
        cooldown: 0
    }
};

export const getTrapConfig = (id: string): TrapConfig | undefined => {
    return TRAP_DEFINITIONS[id];
};
