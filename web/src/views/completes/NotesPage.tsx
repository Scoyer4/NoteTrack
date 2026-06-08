import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotes } from '../../controllers/useNotes';
import NoteCard      from '../partials/NoteCard';
import NoteModal     from '../partials/NoteModal';
import TaskListModal from '../partials/TaskListModal';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Note } from '../../types';
import { CHECKLIST_MARKER } from '../../types';
import styles from './NotesPage.module.css';

const ORDER_KEY = 'notetrack-notes-order';

export default function NotesPage() {
  const {
    notes, loading, fetchNotes,
    createNote, updateNote,
    pinNote, archiveNote, softDeleteNote,
  } = useNotes();

  const [noteModal, setNoteModal] = useState<Note | 'new' | null>(null);
  const [listModal, setListModal] = useState<Note | 'new' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistent order for position stability + drag-and-drop
  const [localOrder, setLocalOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]'); }
    catch { return []; }
  });
  const orderInitRef = useRef(false);

  // Drag state
  const [draggedId,  setDraggedId]  = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // On first successful load, seed localOrder from server order (if nothing saved)
  useEffect(() => {
    if (!orderInitRef.current && !loading && notes.length > 0) {
      orderInitRef.current = true;
      setLocalOrder(prev => {
        if (prev.length > 0) return prev;
        const ids = notes.map(n => n.id);
        localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
        return ids;
      });
    }
  }, [loading, notes]);

  // Apply localOrder on top of server notes; new notes (not yet in order) go to front
  const orderedNotes = useMemo(() => {
    if (localOrder.length === 0) return notes;
    const map = new Map(notes.map(n => [n.id, n]));
    const result: Note[] = [];
    for (const id of localOrder) {
      const n = map.get(id);
      if (n) { result.push(n); map.delete(id); }
    }
    return [...map.values(), ...result];
  }, [notes, localOrder]);

  const pinned  = orderedNotes.filter(n => n.is_pinned);
  const regular = orderedNotes.filter(n => !n.is_pinned);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchNotes(value ? { search: value } : undefined);
    }, 300);
  }, [fetchNotes]);

  function handleEdit(note: Note) {
    if (note.content === CHECKLIST_MARKER) setListModal(note);
    else setNoteModal(note);
  }

  function handleCloseModal() {
    setNoteModal(null);
    setListModal(null);
    // Re-fetch to refresh note data (tags, etc.); localOrder preserves display position
    fetchNotes(search ? { search } : undefined);
  }

  async function handleSoftDelete(id: string) {
    await softDeleteNote(id);
    setConfirmId(null);
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(noteId: string) {
    setDraggedId(noteId);
  }

  function handleDragOver(noteId: string) {
    if (draggedId && draggedId !== noteId) setDragOverId(noteId);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null); setDragOverId(null); return;
    }
    // Prevent dropping between pinned ↔ regular sections
    const dragged = notes.find(n => n.id === draggedId);
    const target  = notes.find(n => n.id === targetId);
    if (!dragged || !target || dragged.is_pinned !== target.is_pinned) {
      setDraggedId(null); setDragOverId(null); return;
    }
    const allIds = orderedNotes.map(n => n.id);
    const from   = allIds.indexOf(draggedId);
    const to     = allIds.indexOf(targetId);
    const next   = [...allIds];
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    setLocalOrder(next);
    localStorage.setItem(ORDER_KEY, JSON.stringify(next));
    setDraggedId(null); setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null); setDragOverId(null);
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderCards(group: Note[]) {
    return group.map(note => (
      <div
        key={note.id}
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; handleDragStart(note.id); }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; handleDragOver(note.id); }}
        onDrop={e => { e.preventDefault(); handleDrop(note.id); }}
        onDragEnd={handleDragEnd}
        className={[
          styles.draggable,
          draggedId  === note.id ? styles.dragging : '',
          dragOverId === note.id ? styles.dragOver : '',
        ].join(' ')}
      >
        <NoteCard
          note={note}
          variant="default"
          onEdit={() => handleEdit(note)}
          onPin={() => pinNote(note.id)}
          onArchive={() => archiveNote(note.id)}
          onSoftDelete={() => setConfirmId(note.id)}
        />
      </div>
    ));
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
        <div className={styles.actions}>
          <button
            id="notes-new-btn"
            className={styles.newBtn}
            onClick={() => setNoteModal('new')}
          >
            + Nueva nota
          </button>
          <button
            id="notes-new-list-btn"
            className={`${styles.newBtn} ${styles.newListBtn}`}
            onClick={() => setListModal('new')}
          >
            ☑ Nueva lista
          </button>
        </div>
      </div>

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

      {!loading && pinned.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📌 Fijadas</h2>
          <div className={styles.grid}>
            {renderCards(pinned)}
          </div>
        </section>
      )}

      {!loading && regular.length > 0 && (
        <section className={styles.section}>
          {pinned.length > 0 && <h2 className={styles.sectionTitle}>Todas las notas</h2>}
          <div className={styles.grid}>
            {renderCards(regular)}
          </div>
        </section>
      )}

      {noteModal !== null && (
        <NoteModal
          note={noteModal === 'new' ? null : noteModal}
          onClose={handleCloseModal}
          onCreate={createNote}
          onUpdate={updateNote}
        />
      )}

      {listModal !== null && (
        <TaskListModal
          note={listModal === 'new' ? null : listModal}
          onClose={handleCloseModal}
          onCreate={createNote}
          onUpdate={updateNote}
        />
      )}

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
