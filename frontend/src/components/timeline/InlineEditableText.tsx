'use client';

import * as React from 'react';

interface InlineEditableTextProps {
    value: string;
    onSave: (newValue: string) => void;
    className?: string;
    inputClassName?: string;
    as?: 'h4' | 'p' | 'span';
    placeholder?: string;
}

export function InlineEditableText({
    value,
    onSave,
    className = '',
    inputClassName = '',
    as: Tag = 'span',
    placeholder = 'Click to edit...',
}: InlineEditableTextProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setEditValue(value);
    }, [value]);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (editValue.trim() !== value) {
            onSave(editValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`bg-white/5 border border-primary/30 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${inputClassName}`}
                placeholder={placeholder}
            />
        );
    }

    return (
        <Tag
            className={`cursor-pointer hover:text-primary transition-colors ${className}`}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
        >
            {value || placeholder}
        </Tag>
    );
}
