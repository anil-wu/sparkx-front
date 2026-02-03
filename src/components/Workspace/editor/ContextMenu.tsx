import React, { useEffect, useRef } from 'react';
import { Trash2, Copy } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useI18n } from '@/i18n/client';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, elementId, onClose }) => {
  const { t } = useI18n();
  const { removeElement, duplicateElement } = useWorkspaceStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Prevent the click from triggering other actions (like deselecting elements)
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  const handleDelete = () => {
    if (elementId) {
      removeElement(elementId);
    }
    onClose();
  };

  const handleDuplicate = () => {
    if (elementId) {
      duplicateElement(elementId);
    }
    onClose();
  };

  if (!elementId) return null;

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button 
        onClick={handleDuplicate}
        className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <Copy size={16} />
        {t('context.copy')}
      </button>
      <button 
        onClick={handleDelete}
        className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 size={16} />
        {t('context.delete')}
      </button>
    </div>
  );
};
