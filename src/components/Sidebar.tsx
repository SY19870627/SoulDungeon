import React from 'react';
import { TOOLS, CATEGORIES, ToolType } from '../data/tools';
import './Sidebar.css';

interface SidebarProps {
    currentTool: ToolType;
    onSelectTool: (tool: ToolType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTool, onSelectTool }) => {
    // Group tools by category
    const toolsByCategory = TOOLS.reduce((acc, tool) => {
        if (!acc[tool.category]) acc[tool.category] = [];
        acc[tool.category].push(tool);
        return acc;
    }, {} as Record<string, typeof TOOLS>);

    return (
        <div className="sidebar">
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
