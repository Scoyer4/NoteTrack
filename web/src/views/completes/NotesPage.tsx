import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes }   from '../../controllers/useNotes';
import { useFolders } from '../../controllers/useFolders';
import NoteCard  from '../partials/NoteCard';
import NoteModal from '../partials/NoteModal';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import styles from './NotesPage.module.css';

export default function NotesPage() {
  const {
    notes, loading, fetchNotes,
    createNote, updateNote,
    pinNote, archiveNote, softDeleteNote,
  } = useNotes();

  const { folders, fetchFolders } = useFolders();

  // Modal state: null = closed, 'new' = create, Note = edit
  const [modal, setModal] = useState<Note | 'new' | null>(null);
  // Confirm delete
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, [fetchNotes, fetchFolders]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchNotes(value ? { search: value } : undefined);
    }, 300);
  }, [fetchNotes]);

  // Derived lists
  const pinned  = notes.filter(n => n.is_pinned);
  const regular = notes.filter(n => !n.is_pinned);

  // Handlers
  async function handleSoftDelete(id: string) {
    await softDeleteNote(id);
    setConfirmId(null);
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            id="notes-search"
            className={styles.search}
            placeholder="Buscar notas…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <button
          id="notes-new-btn"
          className={styles.newBtn}
          onClick={() => setModal('new')}
        >
          + Nueva nota
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📝</div>
          <h2 className={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'Sin notas todavía'}
          </h2>
          <p className={styles.emptyText}>
            {search
              ? `No se encontraron notas con "${search}"`
              : 'Crea tu primera nota pulsando el botón de arriba.'}
          </p>
        </div>
      )}

      {/* Pinned section */}
      {!loading && pinned.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📌 Fijadas</h2>
          <div className={styles.grid}>
            {pinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                variant="default"
                onEdit={() => setModal(note)}
                onPin={() => pinNote(note.id)}
                onArchive={() => archiveNote(note.id)}
                onSoftDelete={() => setConfirmId(note.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All notes section */}
      {!loading && regular.length > 0 && (
        <section className={styles.section}>
          {pinned.length > 0 && (
            <h2 className={styles.sectionTitle}>Todas las notas</h2>
          )}
          <div className={styles.grid}>
            {regular.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                variant="default"
                onEdit={() => setModal(note)}
                onPin={() => pinNote(note.id)}
                onArchive={() => archiveNote(note.id)}
                onSoftDelete={() => setConfirmId(note.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {modal !== null && (
        <NoteModal
          note={modal === 'new' ? null : modal}
          folders={folders}
          onClose={() => { setModal(null); fetchNotes(search ? { search } : undefined); }}
          onCreate={createNote}
          onUpdate={updateNote}
        />
      )}

      {/* Confirm delete */}
      {confirmId && (
        <ConfirmDialog
          title="¿Mover a papelera?"
          message="La nota se moverá a la papelera. Podrás restaurarla desde allí."
          confirmLabel="Mover a papelera"
          onConfirm={() => handleSoftDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
