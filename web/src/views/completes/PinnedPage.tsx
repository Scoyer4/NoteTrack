import { useState, useEffect } from 'react';
import { useNotes }   from '../../controllers/useNotes';
import { useFolders } from '../../controllers/useFolders';
import { notesService } from '../../services/api';
import NoteCard      from '../partials/NoteCard';
import NoteModal     from '../partials/NoteModal';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import styles from './NotesPage.module.css';

export default function PinnedPage() {
  const { createNote, updateNote, pinNote, archiveNote, softDeleteNote } = useNotes();
  const { folders, fetchFolders } = useFolders();

  const [notes,     setNotes]     = useState<Note[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<Note | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
    notesService.getPinned()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchFolders]);

  async function handlePin(id: string) {
    await pinNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function handleArchive(id: string) {
    await archiveNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function handleSoftDelete(id: string) {
    await softDeleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setConfirmId(null);
  }

  async function handleUpdate(id: string, data: Parameters<typeof updateNote>[1]) {
    const updated = await updateNote(id, data);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Notas fijadas</h1>
        {!loading && <span className={styles.pageCount}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</span>}
      </div>

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📌</div>
          <h2 className={styles.emptyTitle}>Sin notas fijadas</h2>
          <p className={styles.emptyText}>Fija una nota desde el menú de opciones para verla aquí.</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className={styles.grid}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              variant="default"
              onEdit={() => setModal(note)}
              onPin={() => handlePin(note.id)}
              onArchive={() => handleArchive(note.id)}
              onSoftDelete={() => setConfirmId(note.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <NoteModal
          note={modal}
          folders={folders}
          onClose={() => setModal(null)}
          onCreate={createNote}
          onUpdate={handleUpdate}
        />
      )}

      {confirmId && (
        <ConfirmDialog
          title="¿Mover a papelera?"
          message="La nota se moverá a la papelera."
          confirmLabel="Mover a papelera"
          onConfirm={() => handleSoftDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
