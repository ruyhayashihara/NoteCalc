import { useState } from 'react';
import { Plus, X, LogOut, FileText, Settings, History, Download } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notes: any[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  user: any;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenExport?: () => void;
}

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote, 
  onDeleteNote, 
  user, 
  onLogout,
  onOpenSettings,
  onOpenHistory,
  onOpenExport,
}: SidebarProps) => {
  const { theme } = useTheme();
  return (
    <>
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div 
        className={`absolute inset-y-0 left-0 w-72 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.border }}>
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>My Notes</h2>
          <button onClick={onClose} className="p-1 rounded-full transition-colors" style={{ color: theme.colors.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
          <button 
             onClick={onCreateNote}
             className="w-full flex items-center justify-center p-3 rounded-lg shadow font-medium transition-all transform active:scale-95"
             style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
          >
            <Plus size={20} className="mr-2" /> New Scratchpad
          </button>
        </div>

        {/* PRO Features Menu */}
        <div className="flex items-center p-2 gap-2 border-b" style={{ borderColor: theme.colors.border }}>
          <button 
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
            style={{ backgroundColor: theme.colors.keyDefault, color: theme.colors.text }}
          >
            <Settings size={16} />
            <span className="text-sm">Themes</span>
          </button>
          <button 
            onClick={onOpenHistory}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
            style={{ backgroundColor: theme.colors.keyDefault, color: theme.colors.text }}
          >
            <History size={16} />
            <span className="text-sm">History</span>
          </button>
          <button 
            onClick={onOpenExport}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
            style={{ backgroundColor: theme.colors.keyDefault, color: theme.colors.text }}
          >
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notes.map(note => (
             <div 
               key={note.id}
               className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeNoteId === note.id ? 'ring-2' : ''}`}
               style={{ 
                 backgroundColor: activeNoteId === note.id ? `${theme.colors.primary}20` : theme.colors.keyDefault,
                 borderColor: activeNoteId === note.id ? theme.colors.primary : theme.colors.border,
                 borderWidth: activeNoteId === note.id ? 2 : 1,
               }}
             >
                <div 
                  className="flex items-center flex-1 overflow-hidden"
                  onClick={() => { onSelectNote(note.id); onClose(); }}
                >
                   <FileText size={18} className="mr-3" style={{ color: activeNoteId === note.id ? theme.colors.primary : theme.colors.textSecondary }} />
                   <span className="truncate font-medium" style={{ color: theme.colors.text }}>{note.title || 'Untitled Note'}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                  className="p-2 ml-2 rounded-full transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                >
                   <X size={16} />
                </button>
             </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
               No notes yet. Create one!
            </div>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSecondary }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full mr-3 border" style={{ borderColor: theme.colors.border }} />}
              <span className="truncate text-sm font-medium" style={{ color: theme.colors.text }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 rounded-full transition-colors"
              style={{ color: theme.colors.textSecondary }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
