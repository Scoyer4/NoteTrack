import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../../controllers/useNotes';
import { useFolders } from '../../controllers/useFolders';
import NoteCard        from '../partials/NoteCard';
import NoteModal       from '../partials/NoteModal';
import TaskListModal   from '../partials/TaskListModal';
import ConfirmDialog   from '../partials/ConfirmDialog';
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

  const { folders, fetchFolders } = useFolders();

  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const folderId       = searchParams.get('folderId') ?? undefined;

  const activeFolder = useMemo(
    () => folders.find(f => f.id === folderId) ?? null,
    [folders, folderId],
  );

  const folderMap = useMemo(
    () => new Map(folders.map(f => [f.id, f])),
    [folders],
  );

  // Modal de notas normales
  const [noteModal, setNoteModal] = useState<Note | 'new' | null>(null);
  // Modal de listas de tareas
  const [listModal, setListModal] = useState<Note | 'new' | null>(null);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  type FilterTab = 'all' | 'notes' | 'lists';
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const [search, setSearch] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localOrder, setLocalOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]'); }
    catch { return []; }
  });
  const orderInitRef = useRef(false);

  const [draggedId,  setDraggedId]  = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  useEffect(() => {
    fetchNotes(folderId ? { folderId } : undefined);
  }, [fetchNotes, folderId]);

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

  const pinned = orderedNotes.filter(n => {
    if (!n.is_pinned) return false;
    if (activeTab === 'notes') return n.content !== CHECKLIST_MARKER;
    if (activeTab === 'lists') return n.content === CHECKLIST_MARKER;
    return true;
  });

  const regular = orderedNotes.filter(n => {
    if (n.is_pinned) return false;
    if (activeTab === 'notes') return n.content !== CHECKLIST_MARKER;
    if (activeTab === 'lists') return n.content === CHECKLIST_MARKER;
    return true;
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchNotes(value ? { search: value, folderId } : folderId ? { folderId } : undefined);
    }, 300);
  }, [fetchNotes, folderId]);

  // ← CAMBIO: abre el modal correcto según el tipo de nota
  function handleEdit(note: Note) {
    if (note.content === CHECKLIST_MARKER) {
      setListModal(note);
    } else {
      setNoteModal(note);
    }
  }

  function handleCloseModal() {
    setNoteModal(null);
    setListModal(null);
    fetchNotes(folderId ? { folderId } : search ? { search } : undefined);
  }

  async function handleSoftDelete(id: string) {
    await softDeleteNote(id);
    setConfirmId(null);
  }

  function handleDragStart(noteId: string) { setDraggedId(noteId); }

  function handleDragOver(noteId: string) {
    if (draggedId && draggedId !== noteId) setDragOverId(noteId);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null); setDragOverId(null); return;
    }
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

  function handleDragEnd() { setDraggedId(null); setDragOverId(null); }

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
          folder={note.folder_id ? (folderMap.get(note.folder_id) ?? null) : null}
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
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
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
          {/* ← CAMBIO: botón de nueva lista aquí */}
          <button
            className={styles.newListBtn}
            onClick={() => setListModal('new')}
          >
            ☰ Nueva lista
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {!folderId && (
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${activeTab === 'all'   ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todas
          </button>
          <button
            className={`${styles.filterTab} ${activeTab === 'notes' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notas
          </button>
          <button
            className={`${styles.filterTab} ${activeTab === 'lists' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            Listas
          </button>
        </div>
      )}

      {activeFolder && (
        <div
          className={styles.folderBanner}
          style={{ borderLeftColor: activeFolder.color || '#6366f1' }}
        >
          <span className={styles.folderBannerIcon}>{activeFolder.icon || '📁'}</span>
          <span className={styles.folderBannerName}>{activeFolder.name}</span>
          <button
            className={styles.folderBannerClear}
            onClick={() => navigate('/folders')}
            title="Volver a carpetas"
          >
            ✕
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className={styles.empty}>
          {activeFolder && <div className={styles.emptyIcon}>{activeFolder.icon || '📁'}</div>}
          <h2 className={styles.emptyTitle}>
            {search
              ? 'Sin resultados'
              : activeFolder
              ? `Sin notas en "${activeFolder.name}"`
              : 'Sin notas todavía'}
          </h2>
          <p className={styles.emptyText}>
            {search
              ? `No se encontraron notas con "${search}"`
              : activeFolder
              ? 'Crea una nota con el botón de arriba para añadirla a esta carpeta.'
              : 'Crea tu primera nota pulsando el botón de arriba.'}
          </p>
        </div>
      )}

      {!loading && pinned.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Fijadas</h2>
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

      {/* Modal de nota normal */}
      {noteModal !== null && (
        <NoteModal
          note={noteModal === 'new' ? null : noteModal}
          defaultFolderId={noteModal === 'new' ? (folderId ?? null) : undefined}
          onClose={handleCloseModal}
          onCreate={createNote}
          onUpdate={updateNote}
        />
      )}

      {/* Modal de lista de tareas */}
      {listModal !== null && (
        <TaskListModal
          note={listModal === 'new' ? null : listModal}
          defaultFolderId={listModal === 'new' ? (folderId ?? null) : undefined}
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