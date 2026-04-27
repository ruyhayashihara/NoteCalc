import { useState, useEffect } from 'react';
import { Plus, X, LogOut, FileText } from 'lucide-react';

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
}

export const Sidebar = ({ isOpen, onClose, notes, activeNoteId, onSelectNote, onCreateNote, onDeleteNote, user, onLogout }: SidebarProps) => {
  return (
    <>
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div 
        className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
           <h2 className="text-xl font-semibold text-gray-800">My Notes</h2>
           <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
             <X size={20} />
           </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <button 
             onClick={onCreateNote}
             className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium transition-colors"
          >
            <Plus size={20} className="mr-2" /> New Scratchpad
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notes.map(note => (
             <div 
               key={note.id}
               className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeNoteId === note.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
             >
                <div 
                  className="flex items-center flex-1 overflow-hidden"
                  onClick={() => { onSelectNote(note.id); onClose(); }}
                >
                   <FileText size={18} className={`mr-3 ${activeNoteId === note.id ? 'text-blue-500' : 'text-gray-400'}`} />
                   <span className="truncate font-medium text-gray-700">{note.title || 'Untitled Note'}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                  className="p-2 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                   <X size={16} />
                </button>
             </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
               No notes yet. Create one!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
               {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full mr-3 border border-gray-300" />}
               <span className="truncate text-sm font-medium text-gray-700">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"
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
