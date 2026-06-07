import { useState, useEffect } from 'react';
import { notesService } from '../../services/api';
import NoteCard      from '../partials/NoteCard';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import styles from './NotesPage.module.css';

export default function TrashPage() {
  const [notes,       setNotes]       = useState<Note[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [emptyingAll, setEmptyingAll] = useState(false);
  const [confirmAll,  setConfirmAll]  = useState(false);

  useEffect(() => {
    notesService.getDeleted()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleRestore(id: string) {
    await notesService.restore(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function handleHardDelete(id: string) {
    await notesService.hardDelete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setConfirmId(null);
  }

  async function handleEmptyTrash() {
    setEmptyingAll(true);
    try {
      await Promise.all(notes.map(n => notesService.hardDelete(n.id)));
      setNotes([]);
    } catch (err) {
      console.error('Error vaciando papelera:', err);
    } finally {
      setEmptyingAll(false);
      setConfirmAll(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Papelera</h1>
        {!loading && notes.length > 0 && (
          <button
            id="trash-empty-btn"
            className={styles.dangerBtn}
            onClick={() => setConfirmAll(true)}
            disabled={emptyingAll}
          >
            {emptyingAll ? 'Vaciando…' : 'Vaciar papelera'}
          </button>
        )}
      </div>

      {notes.length > 0 && !loading && (
        <div className={styles.infoBar}>
          <span>Las notas de la papelera se pueden restaurar o eliminar definitivamente.</span>
        </div>
      )}

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗑️</div>
          <h2 className={styles.emptyTitle}>La papelera está vacía</h2>
          <p className={styles.emptyText}>Las notas eliminadas aparecerán aquí antes de borrarse definitivamente.</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className={styles.grid}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              variant="trash"
              onRestore={() => handleRestore(note.id)}
              onHardDelete={() => setConfirmId(note.id)}
            />
          ))}
        </div>
      )}

      {/* Confirm individual delete */}
      {confirmId && (
        <ConfirmDialog
          title="¿Eliminar definitivamente?"
          message="Esta acción no se puede deshacer. La nota desaparecerá para siempre."
          confirmLabel="Eliminar definitivamente"
          onConfirm={() => handleHardDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Confirm empty all */}
      {confirmAll && (
        <ConfirmDialog
          title="¿Vaciar la papelera?"
          message={`Se eliminarán definitivamente ${notes.length} nota${notes.length !== 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
          confirmLabel="Vaciar papelera"
          onConfirm={handleEmptyTrash}
          onCancel={() => setConfirmAll(false)}
        />
      )}
    </div>
  );
}
