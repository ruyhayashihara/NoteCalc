import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Calculator } from './components/Calculator';
import { Sidebar } from './components/Sidebar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ExportProvider } from './contexts/ExportContext';
import { HistoryProvider } from './contexts/HistoryContext';

function AppContent() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    // Fetch initial notes
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('userid', user.id)
        .order('updatedat', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return;
      }

      setNotes(data);
      if (data.length > 0 && !activeNoteId) {
        setActiveNoteId(data[0].id);
      }
    };

    fetchNotes();

    // Set up real-time subscription for notes
    const notesChannel = supabase
      .channel('public:notes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `userid=eq.${user.id}` },
        (payload) => {
          console.log('Real-time change received:', payload);
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(note => note.id === payload.new.id ? payload.new : note));
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
    };
  }, [user]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  const handleCreateNote = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title: `Note ${new Date().toLocaleDateString()}`,
            content: '',
            drawing: '',
            userid: user.id,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newNote = data[0];
        // Update local state immediately - don't wait for real-time
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleSaveNote = async (content: string, drawing: string, explicitTitle?: string) => {
    if (!activeNoteId || !user) return;
    try {
      let newTitle = explicitTitle;
      if (!newTitle || newTitle.trim() === '') {
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        newTitle = lines.length > 0 ? lines[0].substring(0, 30) : activeNote?.title || 'Untitled';
      }

      const updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from('notes')
        .update({ content, drawing, title: newTitle, updatedat: updatedAt })
        .eq('id', activeNoteId)
        .eq('userid', user.id);

      if (error) throw error;

      // Update local state immediately - don't wait for real-time
      setNotes(prev =>
        prev.map(note =>
          note.id === activeNoteId
            ? { ...note, content, drawing, title: newTitle, updatedat: updatedAt }
            : note
        )
      );
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('userid', user.id);

      if (error) throw error;

      // Update local state immediately - don't wait for real-time
      setNotes(prev => prev.filter(note => note.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleSignInWithEmail = async () => {
    try {
      setAuthMessage({ text: '', type: '' });
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        setAuthMessage({ text: `Error: ${error.message}`, type: 'error' });
        return;
      }
    } catch (error: any) {
      setAuthMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  const handleSignUpWithEmail = async () => {
    try {
      setAuthMessage({ text: '', type: '' });
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) {
        setAuthMessage({ text: `Error: ${error.message}`, type: 'error' });
        return;
      }
      if (data.user) {
        setAuthMessage({ text: 'Account created! Check your email for confirmation.', type: 'success' });
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setAuthMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };

  if (!authInitialized) {
    return <div className="flex bg-[#f2f3f5] items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="flex bg-[#f2f3f5] flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-2xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Scratchpad PRO</h1>
          <p className="text-gray-500 mb-8">Calculate, take notes, and draw with style.</p>
          
          <button 
            onClick={handleSignInWithGoogle}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors mb-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-gray-500 font-medium">or continue with email</span>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              onClick={isSignUp ? handleSignUpWithEmail : handleSignInWithEmail}
              disabled={!email || !password}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            {authMessage.text && (
              <div className={`p-3 rounded-lg text-sm text-center font-medium ${authMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {authMessage.text}
              </div>
            )}

            <div className="pt-4 text-center">
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthMessage({ text: '', type: '' });
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center flex-1 h-screen w-full bg-gray-100 overflow-hidden font-sans">
      <div className="flex flex-col w-full max-w-lg h-full bg-white relative shadow-2xl overflow-hidden shadow-gray-400/20 md:border-x md:border-gray-200">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          user={user}
          onLogout={handleSignOut}
        />

        <main className="flex-1 w-full h-full relative flex flex-col">
          {activeNoteId && activeNote ? (
            <Calculator 
              key={activeNoteId}
              title={activeNote.title}
              initialContent={activeNote.content || ''}
              initialDrawing={activeNote.drawing || ''}
              onSave={handleSaveNote}
              onMenuClick={() => setIsSidebarOpen(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#f2f3f5] p-6 text-center">
              <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 p-2 text-gray-600 hover:bg-gray-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              <div className="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">No active scratchpad</h2>
              <p className="text-gray-500 mb-6">Create a new scratchpad or select one from the menu.</p>
              <button 
                onClick={handleCreateNote}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium transition-colors"
              >
                New Scratchpad
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helper functions for auth
const handleSignInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    // Note: signInWithOAuth will redirect, so we don't expect to reach here in the same page load
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};

const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
export default function App() {
  return (
    <ThemeProvider>
      <ExportProvider>
        <HistoryProvider>
          <AppContent />
        </HistoryProvider>
      </ExportProvider>
    </ThemeProvider>
  );
}
