import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note, NoteColor, Tag } from '../../types';
import { tagsService } from '../../services/api';
import styles from './NoteModal.module.css';

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

export interface NoteModalProps {
  note?: Note | null;
  onClose: () => void;
  onCreate: (data: { title: string; content?: string; color?: NoteColor }) => Promise<Note>;
  onUpdate: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'color'>>) => Promise<Note>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function NoteModal({ note: initialNote, onClose, onCreate, onUpdate }: NoteModalProps) {
  const [note,       setNote]       = useState<Note | null>(initialNote ?? null);
  const [title,      setTitle]      = useState(initialNote?.title    ?? '');
  const [content,    setContent]    = useState(initialNote?.content  ?? '');
  const [color,      setColor]      = useState<NoteColor>(initialNote?.color ?? 'default');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [creating,   setCreating]   = useState(false);

  const [availableTags,  setAvailableTags]  = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(initialNote?.tags?.map(t => t.id) ?? [])
  );
  const [showTagPicker, setShowTagPicker] = useState(false);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const isEdit       = note !== null;

  useEffect(() => {
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

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const scheduleSave = useCallback((newTitle: string, newContent: string) => {
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
  }, [note, onUpdate]);

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

  async function handleCreate() {
    if (!title.trim() && !content.trim()) return;
    setCreating(true);
    try {
      const created = await onCreate({ title, content, color });
      setNote(created);
      for (const tagId of selectedTagIds) {
        await tagsService.addToNote(created.id, tagId);
      }
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
          <span className={styles.mode}>{isEdit ? 'Editando nota' : 'Nueva nota'}</span>
          <div className={styles.headerRight}>
            {isEdit && saveStatus !== 'idle' && (
              <span className={`${styles.saveStatus} ${saveLabelClass}`}>
                {saveStatus === 'saving' && 'Guardando…'}
                {saveStatus === 'saved'  && '✓ Guardado'}
                {saveStatus === 'error'  && '⚠ Error'}
              </span>
            )}
            <button className={styles.closeBtn} onClick={onClose} title="Cerrar (Esc)">✕</button>
          </div>
        </div>

        {/* Title */}
        <input
          id="note-modal-title"
          className={styles.titleInput}
          placeholder="Título de la nota…"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          autoFocus
          maxLength={200}
        />

        {/* Content */}
        <textarea
          id="note-modal-content"
          className={styles.contentArea}
          placeholder="Escribe algo…"
          value={content}
          onChange={e => handleContentChange(e.target.value)}
        />

        {/* Selected tag chips */}
        {selectedTagIds.size > 0 && (
          <div className={styles.tagChips}>
            {availableTags.filter(t => selectedTagIds.has(t.id)).map(tag => (
              <span key={tag.id} className={styles.tagChip} style={{ borderColor: tag.color }}>
                {tag.name}
                <button className={styles.tagChipRemove} onClick={() => handleToggleTag(tag.id)}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Tools row */}
        <div className={styles.tools}>
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

          {availableTags.length > 0 && (
            <div className={styles.tagPickerWrap} ref={tagPickerRef}>
              <button
                className={styles.tagPickerBtn}
                onClick={() => setShowTagPicker(p => !p)}
                title="Etiquetas"
              >
                🏷
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

        {/* Create button — only in create mode */}
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
