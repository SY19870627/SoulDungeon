import React from 'react';
import { TOOLS, CATEGORIES, ToolType } from '../data/tools';
import './Sidebar.css';

interface SidebarProps {
    currentTool: ToolType;
    onSelectTool: (tool: ToolType) => void;
    onSpawnHero: (type: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTool, onSelectTool, onSpawnHero }) => {
    // Group tools by category
    const toolsByCategory = TOOLS.reduce((acc, tool) => {
        if (!acc[tool.category]) acc[tool.category] = [];
        acc[tool.category].push(tool);
        return acc;
    }, {} as Record<string, typeof TOOLS>);

    return (
        <div className="sidebar">
            <div className="tool-category">投放冒險者</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button className="tool-btn" onClick={() => onSpawnHero('knight')} style={{ borderColor: '#2ecc71' }}>
                    <span className="tool-icon">🛡️</span> 騎士
                </button>
                <button className="tool-btn" onClick={() => onSpawnHero('glutton')} style={{ borderColor: '#d35400' }}>
                    <span className="tool-icon">🐷</span> 貪吃鬼
                </button>
                <button className="tool-btn" onClick={() => onSpawnHero('thief')} style={{ borderColor: '#8e44ad' }}>
                    <span className="tool-icon">🥷</span> 盜賊
                </button>
            </div>

            {Object.entries(CATEGORIES).map(([catKey, catName]) => {
                const categoryTools = toolsByCategory[catKey];
                if (!categoryTools) return null;

                return (
                    <div key={catKey} className="tool-group">
                        <div className="tool-category">{catName}</div>
                        {categoryTools.map(tool => (
                            <button
                                key={tool.id}
                                className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                                onClick={() => onSelectTool(tool.id)}
                            >
                                <span className="tool-icon">{tool.icon}</span>
                                <span className="tool-name">{tool.name}</span>
                                {tool.hint && <span className="combo-hint">{tool.hint}</span>}
                            </button>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
