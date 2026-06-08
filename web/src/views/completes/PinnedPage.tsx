import { useState, useEffect } from 'react';
import { useNotes } from '../../controllers/useNotes';
import { notesService } from '../../services/api';
import NoteCard      from '../partials/NoteCard';
import NoteModal     from '../partials/NoteModal';
import TaskListModal from '../partials/TaskListModal';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import { CHECKLIST_MARKER } from '../../types';
import styles from './NotesPage.module.css';

export default function PinnedPage() {
  const { createNote, updateNote, pinNote, archiveNote, softDeleteNote } = useNotes();

  const [notes,     setNotes]     = useState<Note[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [noteModal, setNoteModal] = useState<Note | null>(null);
  const [listModal, setListModal] = useState<Note | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    notesService.getPinned()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleEdit(note: Note) {
    if (note.content === CHECKLIST_MARKER) setListModal(note);
    else setNoteModal(note);
  }

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
              onEdit={() => handleEdit(note)}
              onPin={() => handlePin(note.id)}
              onArchive={() => handleArchive(note.id)}
              onSoftDelete={() => setConfirmId(note.id)}
            />
          ))}
        </div>
      )}

      {noteModal && (
        <NoteModal
          note={noteModal}
          onClose={() => setNoteModal(null)}
          onCreate={createNote}
          onUpdate={handleUpdate}
        />
      )}

      {listModal && (
        <TaskListModal
          note={listModal}
          onClose={() => setListModal(null)}
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
