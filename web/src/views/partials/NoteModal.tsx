import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note, NoteColor, Folder } from '../../types';
import { useTasks } from '../../controllers/useTasks';
import styles from './NoteModal.module.css';

// ── Color palette ─────────────────────────────────────────────────────────────

interface ColorOption { value: NoteColor; label: string; dot: string }

const COLORS: ColorOption[] = [
  { value: 'default', label: 'Por defecto', dot: '#52525b' },
  { value: 'yellow',  label: 'Amarillo',    dot: '#eab308' },
  { value: 'green',   label: 'Verde',        dot: '#22c55e' },
  { value: 'blue',    label: 'Azul',         dot: '#3b82f6' },
  { value: 'purple',  label: 'Morado',       dot: '#a855f7' },
  { value: 'pink',    label: 'Rosa',         dot: '#ec4899' },
  { value: 'red',     label: 'Rojo',         dot: '#ef4444' },
  { value: 'orange',  label: 'Naranja',      dot: '#f97316' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NoteModalProps {
  /** undefined = create mode, Note = edit mode */
  note?: Note | null;
  folders: Folder[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    content?: string;
    color?: NoteColor;
    folder_id?: string | null;
  }) => Promise<Note>;
  onUpdate: (
    id: string,
    data: Partial<Pick<Note, 'title' | 'content' | 'color' | 'folder_id'>>,
  ) => Promise<Note>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

export default function NoteModal({
  note: initialNote,
  folders,
  onClose,
  onCreate,
  onUpdate,
}: NoteModalProps) {
  // Active note (may change from null→Note after creation)
  const [note, setNote] = useState<Note | null>(initialNote ?? null);

  // Form state
  const [title,    setTitle]    = useState(initialNote?.title    ?? '');
  const [content,  setContent]  = useState(initialNote?.content  ?? '');
  const [color,    setColor]    = useState<NoteColor>(initialNote?.color ?? 'default');
  const [folderId, setFolderId] = useState<string | null>(initialNote?.folder_id ?? null);

  // UI state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [creating,   setCreating]   = useState(false);
  const [newTask,    setNewTask]     = useState('');

  const { tasks, loading: loadingTasks, fetchTasks, createTask, toggleTask, removeTask } = useTasks();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEdit = note !== null;

  // Load tasks when editing an existing note
  useEffect(() => {
    if (note?.id) fetchTasks(note.id);
  }, [note?.id, fetchTasks]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Autosave ───────────────────────────────────────────────────────────────

  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!note) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus('saving');
      debounceRef.current = setTimeout(async () => {
        try {
          const updated = await onUpdate(note.id, { title: newTitle, content: newContent });
          setNote(updated);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }, 1500);
    },
    [note, onUpdate],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave(val, content);
  }

  function handleContentChange(val: string) {
    setContent(val);
    scheduleSave(title, val);
  }

  async function handleColorChange(newColor: NoteColor) {
    setColor(newColor);
    if (note) {
      try {
        const updated = await onUpdate(note.id, { color: newColor });
        setNote(updated);
      } catch { /* silent */ }
    }
  }

  async function handleFolderChange(newFolderId: string | null) {
    setFolderId(newFolderId);
    if (note) {
      try {
        const updated = await onUpdate(note.id, { folder_id: newFolderId });
        setNote(updated);
      } catch { /* silent */ }
    }
  }

  async function handleCreate() {
    if (!title.trim() && !content.trim()) return;
    setCreating(true);
    try {
      const created = await onCreate({ title, content, color, folder_id: folderId });
      setNote(created);
      fetchTasks(created.id);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

  async function handleAddTask() {
    if (!note || !newTask.trim()) return;
    await createTask(note.id, newTask.trim());
    setNewTask('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const saveLabelClass =
    saveStatus === 'saving' ? styles.statusSaving :
    saveStatus === 'saved'  ? styles.statusSaved  :
    saveStatus === 'error'  ? styles.statusError  : '';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ borderTopColor: COLORS.find(c => c.value === color)?.dot ?? 'transparent' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header ------------------------------------------------------------ */}
        <div className={styles.header}>
          <span className={styles.mode}>
            {isEdit ? 'Editando nota' : 'Nueva nota'}
          </span>
          <div className={styles.headerRight}>
            {isEdit && saveStatus !== 'idle' && (
              <span className={`${styles.saveStatus} ${saveLabelClass}`}>
                {saveStatus === 'saving' && 'Guardando…'}
                {saveStatus === 'saved'  && '✓ Guardado'}
                {saveStatus === 'error'  && '⚠ Error'}
              </span>
            )}
            <button
              id="note-modal-close"
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Title ------------------------------------------------------------- */}
        <input
          id="note-modal-title"
          className={styles.titleInput}
          placeholder="Título de la nota…"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          autoFocus
          maxLength={200}
        />

        {/* Content ------------------------------------------------------------ */}
        <textarea
          id="note-modal-content"
          className={styles.contentArea}
          placeholder="Escribe algo…"
          value={content}
          onChange={e => handleContentChange(e.target.value)}
        />

        {/* Tools row ---------------------------------------------------------- */}
        <div className={styles.tools}>
          {/* Color picker */}
          <div className={styles.colorRow}>
            {COLORS.map(c => (
              <button
                key={c.value}
                className={`${styles.colorDot} ${color === c.value ? styles.colorActive : ''}`}
                style={{ background: c.dot }}
                title={c.label}
                onClick={() => handleColorChange(c.value)}
                aria-label={`Color: ${c.label}`}
              />
            ))}
          </div>

          {/* Folder selector */}
          <select
            id="note-modal-folder"
            className={styles.folderSelect}
            value={folderId ?? ''}
            onChange={e => handleFolderChange(e.target.value || null)}
          >
            <option value="">Sin carpeta</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Tasks — only in edit mode ------------------------------------------ */}
        {isEdit && (
          <div className={styles.tasks}>
            <h4 className={styles.tasksTitle}>Tareas</h4>

            {loadingTasks ? (
              <p className={styles.tasksLoading}>Cargando tareas…</p>
            ) : (
              <>
                {tasks.map(task => (
                  <div key={task.id} className={styles.taskItem}>
                    <button
                      className={`${styles.taskCheck} ${task.is_completed ? styles.checked : ''}`}
                      onClick={() => toggleTask(task.id, task.is_completed)}
                      title={task.is_completed ? 'Marcar incompleta' : 'Marcar completa'}
                    />
                    <span className={`${styles.taskLabel} ${task.is_completed ? styles.taskDone : ''}`}>
                      {task.title}
                    </span>
                    <button
                      className={styles.taskRemove}
                      onClick={() => removeTask(task.id)}
                      title="Eliminar tarea"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className={styles.taskInputRow}>
                  <input
                    id="note-modal-new-task"
                    className={styles.taskInput}
                    placeholder="Añadir tarea…"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
                  />
                  <button
                    className={styles.taskAddBtn}
                    onClick={handleAddTask}
                    disabled={!newTask.trim()}
                  >
                    +
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Create button — only in create mode -------------------------------- */}
        {!isEdit && (
          <div className={styles.createRow}>
            <button
              id="note-modal-create"
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={creating || (!title.trim() && !content.trim())}
            >
              {creating ? 'Creando…' : 'Crear nota'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
