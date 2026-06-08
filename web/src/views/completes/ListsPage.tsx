import { useState, useEffect } from 'react';
import { useNotes } from '../../controllers/useNotes';
import NoteCard      from '../partials/NoteCard';
import TaskListModal from '../partials/TaskListModal';
import { CHECKLIST_MARKER } from '../../types';
import type { Note, NoteColor } from '../../types';
import styles from './NotesPage.module.css';

export default function ListsPage() {
  const {
    notes, fetchNotes,
    createNote, updateNote,
    softDeleteNote,
    pinNote, archiveNote
  } = useNotes();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Solo cargar notas de tipo checklist
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Filtrar solo las listas en el frontend
  const lists = notes.filter(n => n.content === CHECKLIST_MARKER);

  async function handleCreate(data: { title: string; content: string; color?: NoteColor }) {
    return createNote({ ...data, content: CHECKLIST_MARKER });
  }

  async function handleUpdate(id: string, data: Partial<Pick<Note, 'title' | 'color'>>) {
    return updateNote(id, data);
  }

  function handleOpenCreate() {
    setEditingNote(null);
    setModalOpen(true);
  }

  function handleOpenEdit(note: Note) {
    setEditingNote(note);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditingNote(null);
    fetchNotes();
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>Mis listas</h1>
        <button className={styles.newBtn} onClick={handleOpenCreate}>
          + Nueva lista
        </button>
      </div>

      {lists.length === 0 ? (
        <div className={styles.empty}>
          <p>No tienes listas todavía.</p>
          <p>Crea tu primera lista pulsando el botón de arriba.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {lists.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              variant="default"
              onEdit={() => handleOpenEdit(note)}
              onPin={() => pinNote(note.id)}
              onArchive={() => archiveNote(note.id)}
              onSoftDelete={() => softDeleteNote(note.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskListModal
          note={editingNote}
          onClose={handleClose}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}