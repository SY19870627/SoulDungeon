import { ToolType } from './tools';

export type HeroType = 'knight' | 'glutton' | 'thief';

export interface HeroDefinition {
    id: HeroType;
    name: string;
    icon: string;
    hp: number;
    lure: ToolType | null;
    range: number;
    color: number;
}

export const HEROES: Record<HeroType, HeroDefinition> = {
    knight: { id: 'knight', name: '騎士', icon: '🛡️', hp: 100, lure: null, range: 0, color: 0x2ecc71 },
    glutton: { id: 'glutton', name: '貪吃鬼', icon: '🐷', hp: 150, lure: 'meat', range: 3, color: 0xd35400 },
    thief: { id: 'thief', name: '盜賊', icon: '🥷', hp: 60, lure: 'treasure', range: 4, color: 0x8e44ad }
};
