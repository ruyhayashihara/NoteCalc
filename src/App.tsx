import { useState, useEffect } from 'react';
import { db, auth, loginWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Calculator } from './components/Calculator';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(fetchedNotes);
      if (fetchedNotes.length > 0 && !activeNoteId) {
        setActiveNoteId(fetchedNotes[0].id);
      }
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return () => unsubscribe();
  }, [user]);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleCreateNote = async () => {
    if (!user) return;
    try {
      const newNote = {
        title: `Note ${new Date().toLocaleDateString()}`,
        content: '',
        drawing: '',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setActiveNoteId(docRef.id);
      setIsSidebarOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const handleSaveNote = async (content: string, drawing: string, explicitTitle?: string) => {
    if (!activeNoteId || !user) return;
    try {
      const noteRef = doc(db, 'notes', activeNoteId);
      
      let newTitle = explicitTitle;
      if (!newTitle || newTitle.trim() === '') {
          // Auto-generate title from first line of content if not empty
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          newTitle = lines.length > 0 ? lines[0].substring(0, 30) : activeNote?.title || 'Untitled';
      }

      await updateDoc(noteRef, {
        content,
        drawing,
        title: newTitle,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${activeNoteId}`);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  };

  if (!authInitialized) {
    return <div className="flex bg-[#f2f3f5] items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="flex bg-[#f2f3f5] flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <span className="text-2xl font-bold">K</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Scratchpad</h1>
            <p className="text-gray-500 mb-8">Calculate, take notes, and draw.</p>
            <button 
              onClick={loginWithGoogle}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors"
            >
              Sign in with Google
            </button>
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
          onLogout={logout}
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
