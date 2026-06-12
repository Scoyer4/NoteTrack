import { useState, useEffect, useRef, useCallback } from 'react';
import type { Folder, Note, NoteColor, Tag } from '../../types';
import { CHECKLIST_MARKER } from '../../types';
import { useTasks } from '../../controllers/useTasks';
import { foldersService, tagsService } from '../../services/api';
import styles from './TaskListModal.module.css';

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

interface PendingItem {
  title: string;
  due_date?: string;
}

export interface TaskListModalProps {
  note?: Note | null;
  defaultFolderId?: string | null;
  onClose: () => void;
  onCreate: (data: { title: string; content: string; color?: NoteColor; folder_id?: string | null }) => Promise<Note>;
  onUpdate: (id: string, data: Partial<Pick<Note, 'title' | 'color' | 'folder_id'>>) => Promise<Note>;
}

export default function TaskListModal({ note: initialNote, defaultFolderId, onClose, onCreate, onUpdate }: TaskListModalProps) {
  const [note,       setNote]       = useState<Note | null>(initialNote ?? null);
  const [title,      setTitle]      = useState(initialNote?.title ?? '');
  const [color,      setColor]      = useState<NoteColor>(initialNote?.color ?? 'default');
  const [folderId,   setFolderId]   = useState<string | null>(initialNote?.folder_id ?? defaultFolderId ?? null);
  const [folders,    setFolders]    = useState<Folder[]>([]);
  const [newItem,    setNewItem]    = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating,   setCreating]   = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Items pendientes antes de crear la nota
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const [availableTags,  setAvailableTags]  = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(initialNote?.tags?.map(t => t.id) ?? [])
  );
  const [showTagPicker,    setShowTagPicker]    = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const { tasks, loading: loadingTasks, fetchTasks, createTask, toggleTask, removeTask } = useTasks();
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newItemRef      = useRef<HTMLInputElement>(null);
  const tagPickerRef    = useRef<HTMLDivElement>(null);
  const folderPickerRef = useRef<HTMLDivElement>(null);
  const isEdit       = note !== null;

  useEffect(() => {
    if (initialNote?.id) fetchTasks(initialNote.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    foldersService.getAll().then(setFolders).catch(() => {});
    tagsService.getAll().then(setAvailableTags).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!showTagPicker) return;
    function handler(e: MouseEvent) {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setShowTagPicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTagPicker]);

  useEffect(() => {
    if (!showFolderPicker) return;
    function handler(e: MouseEvent) {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFolderPicker]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const scheduleSave = useCallback((newTitle: string) => {
    if (!note) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        const updated = await onUpdate(note.id, { title: newTitle });
        setNote(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 1500);
  }, [note, onUpdate]);

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave(val);
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

  async function handleToggleTag(tagId: string) {
    const isSelected = selectedTagIds.has(tagId);
    if (note) {
      try {
        if (isSelected) await tagsService.removeFromNote(note.id, tagId);
        else            await tagsService.addToNote(note.id, tagId);
      } catch { /* silent */ }
    }
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (isSelected) next.delete(tagId); else next.add(tagId);
      return next;
    });
  }

  // En modo edición crea la tarea directamente
  // En modo creación guarda en pendingItems sin tocar la BD
  async function handleAddItem() {
    if (!newItem.trim()) return;

    if (!isEdit) {
      setPendingItems(prev => [...prev, {
        title: newItem.trim(),
        due_date: newDueDate || undefined,
      }]);
      setNewItem('');
      setNewDueDate('');
      newItemRef.current?.focus();
      return;
    }

    await createTask(note.id, newItem.trim(), newDueDate || undefined);
    setNewItem('');
    setNewDueDate('');
    newItemRef.current?.focus();
  }

  // Solo en modo creación — crea la nota y todas las tareas pendientes
  async function handleCreate() {
    if (!title.trim() && pendingItems.length === 0) return;
    setCreating(true);
    try {
      const finalTitle = title.trim() || 'Lista de tareas';
      const created = await onCreate({
        title: finalTitle,
        content: CHECKLIST_MARKER,
        color,
        folder_id: folderId,
      });
      setNote(created);

      await Promise.all([
        ...pendingItems.map(item =>
          createTask(created.id, item.title, item.due_date)
        ),
        ...[...selectedTagIds].map(tagId =>
          tagsService.addToNote(created.id, tagId)
        ),
      ]);

      onClose();
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

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
        {/* Header */}
        <div className={styles.header}>
          <input
            className={styles.titleInput}
            placeholder="Título de la lista…"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            autoFocus
            maxLength={200}
          />
          <div className={styles.headerRight}>
            {isEdit && saveStatus !== 'idle' && (
              <span className={`${styles.saveStatus} ${saveLabelClass}`}>
                {saveStatus === 'saving' && 'Guardando…'}
                {saveStatus === 'saved'  && '✓ Guardado'}
                {saveStatus === 'error'  && 'Error'}
              </span>
            )}
            <button className={styles.closeBtn} onClick={onClose} title="Cerrar (Esc)">✕</button>
          </div>
        </div>

        {/* Selected tags */}
        {selectedTagIds.size > 0 && (
          <div className={styles.tagChips}>
            {availableTags.filter(t => selectedTagIds.has(t.id)).map(tag => (
              <span key={tag.id} className={styles.tagChip} style={{ '--chip-color': tag.color } as React.CSSProperties}>
                {tag.name}
                <button className={styles.tagChipRemove} onClick={() => handleToggleTag(tag.id)}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Task list */}
        <div className={styles.listBody}>
          {loadingTasks ? (
            <p className={styles.loading}>Cargando…</p>
          ) : (
            <>
              {/* Tareas existentes — solo en modo edición */}
              {isEdit && tasks.map(task => (
                <div key={task.id} className={styles.item}>
                  <span className={styles.dragHandle}>⠿</span>
                  <button
                    className={`${styles.checkbox} ${task.is_completed ? styles.checked : ''}`}
                    onClick={() => toggleTask(task.id, task.is_completed)}
                  />
                  <span className={`${styles.itemLabel} ${task.is_completed ? styles.itemDone : ''}`}>
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className={styles.taskDate}>
                      {new Date(task.due_date).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  )}
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeTask(task.id)}
                    title="Eliminar"
                  >✕</button>
                </div>
              ))}

              {/* Items pendientes — solo en modo creación */}
              {!isEdit && pendingItems.map((item, i) => (
                <div key={i} className={styles.item}>
                  <span className={styles.dragHandle}>⠿</span>
                  <button className={styles.checkbox} disabled />
                  <span className={styles.itemLabel}>{item.title}</span>
                  {item.due_date && (
                    <span className={styles.taskDate}>
                      {new Date(item.due_date).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  )}
                  <button
                    className={styles.removeBtn}
                    onClick={() => setPendingItems(prev => prev.filter((_, j) => j !== i))}
                    title="Eliminar"
                  >✕</button>
                </div>
              ))}

              {/* Fila para añadir nuevo elemento */}
              <div className={styles.addRow}>
                <span className={styles.addIcon}>+</span>
                <input
                  ref={newItemRef}
                  className={styles.addInput}
                  placeholder="Elemento de lista"
                  value={newItem}
                  disabled={creating}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
                />
                <input
                  type="date"
                  className={styles.dateInput}
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  title="Fecha límite (opcional)"
                />
              </div>
            </>
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.colorRow}>
            {COLORS.map(c => (
              <button
                key={c.value}
                className={`${styles.colorDot} ${color === c.value ? styles.colorActive : ''}`}
                style={{ background: c.dot }}
                title={c.label}
                onClick={() => handleColorChange(c.value)}
              />
            ))}
          </div>

          <div className={styles.pickerGroup}>
            {folders.length > 0 && (
              <div className={styles.tagPickerWrap} ref={folderPickerRef}>
                <button
                  className={styles.tagPickerBtn}
                  onClick={() => setShowFolderPicker(p => !p)}
                  title="Carpeta"
                >
                  {folderId
                    ? (() => { const f = folders.find(f => f.id === folderId); return f ? `${f.icon} ${f.name}` : 'Carpeta'; })()
                    : 'Carpeta'}
                </button>
                {showFolderPicker && (
                  <div className={styles.tagDropdown}>
                    <button
                      className={`${styles.tagOption} ${!folderId ? styles.tagOptionActive : ''}`}
                      onClick={() => { handleFolderChange(null); setShowFolderPicker(false); }}
                    >
                      Sin carpeta
                      {!folderId && <span className={styles.tagOptionCheck}>✓</span>}
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id}
                        className={`${styles.tagOption} ${folderId === f.id ? styles.tagOptionActive : ''}`}
                        onClick={() => { handleFolderChange(f.id); setShowFolderPicker(false); }}
                      >
                        <span>{f.icon}</span>
                        {f.name}
                        {folderId === f.id && <span className={styles.tagOptionCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {availableTags.length > 0 && (
              <div className={styles.tagPickerWrap} ref={tagPickerRef}>
                <button
                  className={styles.tagPickerBtn}
                  onClick={() => setShowTagPicker(p => !p)}
                  title="Etiquetas"
                >
                  Etiquetas
                </button>
                {showTagPicker && (
                  <div className={styles.tagDropdown}>
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        className={`${styles.tagOption} ${selectedTagIds.has(tag.id) ? styles.tagOptionActive : ''}`}
                        onClick={() => handleToggleTag(tag.id)}
                      >
                        <span className={styles.tagOptionDot} style={{ background: tag.color }} />
                        {tag.name}
                        {selectedTagIds.has(tag.id) && <span className={styles.tagOptionCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEdit && (
            <button className={styles.closeBtnToolbar} onClick={onClose}>Cerrar</button>
          )}
        </div>

        {!isEdit && (
          <div className={styles.actionRow}>
            <button className={styles.closeBtnToolbar} onClick={onClose}>Cancelar</button>
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={creating || (!title.trim() && pendingItems.length === 0)}
            >
              {creating ? 'Creando…' : 'Crear lista'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}