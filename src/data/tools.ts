export type ToolType =
    | 'spring' | 'spike'
    | 'meat' | 'treasure'
    | 'oil' | 'fire' | 'water' | 'lightning' | 'poison' | 'fan'
    | 'eraser';

export interface ToolDefinition {
    id: ToolType;
    name: string;
    icon: string;
    hint?: string;
    category: 'physics' | 'lure' | 'element' | 'edit';
}

export const TOOLS: ToolDefinition[] = [
    // Physics
    { id: 'spring', name: '彈簧板', icon: '⏫', hint: '可旋轉', category: 'physics' },
    { id: 'spike', name: '尖刺坑', icon: '🗡️', hint: '30傷', category: 'physics' },

    // Lure
    { id: 'meat', name: '烤肉', icon: '🍖', hint: '吸貪吃鬼', category: 'lure' },
    { id: 'treasure', name: '寶箱', icon: '💰', hint: '吸盜賊', category: 'lure' },

    // Elements
    { id: 'oil', name: '油桶', icon: '🛢️', hint: '+火', category: 'element' },
    { id: 'fire', name: '噴火口', icon: '🔥', hint: '+油', category: 'element' },
    { id: 'water', name: '水坑', icon: '💧', hint: '+雷', category: 'element' },
    { id: 'lightning', name: '雷電塔', icon: '⚡', hint: '+水', category: 'element' },
    { id: 'poison', name: '毒氣', icon: '☠️', hint: '+風', category: 'element' },
    { id: 'fan', name: '風扇', icon: '💨', hint: '+毒', category: 'element' },

    // Edit
    { id: 'eraser', name: '清除', icon: '🧹', category: 'edit' },
];

export const CATEGORIES = {
    physics: '物理陷阱',
    lure: '誘餌',
    element: '化學元素',
    edit: '編輯'
};
