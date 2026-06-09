import { useState, useEffect } from 'react';
import { notesService } from '../../services/api';
import NoteCard      from '../partials/NoteCard';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import styles from './NotesPage.module.css';

export default function ArchivedPage() {
  const [notes,     setNotes]     = useState<Note[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    notesService.getArchived()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUnarchive(id: string) {
    await notesService.archive(id); // toggles back to active
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function handleHardDelete(id: string) {
    await notesService.hardDelete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setConfirmId(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Archivadas</h1>
        {!loading && <span className={styles.pageCount}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</span>}
      </div>

      {notes.length > 0 && !loading && (
        <div className={styles.infoBar}>
          <span>Las notas archivadas no aparecen en la vista principal.</span>
        </div>
      )}

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Sin notas archivadas</h2>
          <p className={styles.emptyText}>Las notas que archivadas aparecerán aquí.</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className={styles.grid}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              variant="archived"
              onUnarchive={() => handleUnarchive(note.id)}
              onHardDelete={() => setConfirmId(note.id)}
            />
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="¿Eliminar definitivamente?"
          message="Esta acción no se puede deshacer. La nota se borrará para siempre."
          confirmLabel="Eliminar definitivamente"
          onConfirm={() => handleHardDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
